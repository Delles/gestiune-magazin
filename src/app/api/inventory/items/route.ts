import { NextRequest, NextResponse } from "next/server";
import {
    inventoryItemCreateSchema,
    TransactionType,
} from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";
import { Database } from "@/types/supabase";

// Helper for structured error response
const createErrorResponse = (
    message: string,
    status: number,
    details?: unknown
) => {
    return NextResponse.json(
        { status, error: message, details: details || null },
        { status }
    );
};

// GET handler for fetching all inventory items
export async function GET() {
    noStore(); // Prevent caching
    try {
        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Query inventory items with category names joined
        const { data, error } = await supabase
            .from("InventoryItems")
            .select(
                `
                *,
                average_purchase_price,
                categories (
                    id,
                    name
                )
            `
            )
            .order("item_name");

        if (error) {
            console.error("Error fetching inventory items:", error);
            return createErrorResponse(
                "Failed to fetch inventory items",
                500,
                error.message
            );
        }

        // Transform the data to include category_name
        const transformedData = data.map((item) => ({
            ...item,
            category_name: item.categories?.name || "Uncategorized",
            categories: undefined, // Remove the categories object
        }));

        return NextResponse.json(transformedData);
    } catch (error: unknown) {
        console.error("Unexpected error fetching inventory items:", error);
        return createErrorResponse(
            error instanceof Error
                ? error.message
                : "An unexpected server error occurred",
            500
        );
    }
}

// POST handler for creating a new inventory item
export async function POST(request: NextRequest) {
    noStore();
    let supabase; // Declare supabase client outside try block

    try {
        // Create Supabase client first
        supabase = await createRouteHandlerSupabaseClient();

        // Get user *before* parsing body, fail fast if not authenticated
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error("API Error: Auth required.", userError);
            return createErrorResponse("Authentication required", 401);
        }

        // Parse request body
        const body = await request.json();

        // Validate request body against the create schema
        const validationResult = inventoryItemCreateSchema.safeParse(body);
        if (!validationResult.success) {
            console.log(
                "API Validation Error (Create Item):",
                validationResult.error.flatten()
            );
            return createErrorResponse(
                "Invalid request data",
                400,
                validationResult.error.flatten().fieldErrors // More detailed errors
            );
        }

        const {
            itemName,
            description,
            categoryId,
            unit,
            sellingPrice, // Use initial selling price from form
            initialStock,
            initialPurchasePrice, // Use new field
            reorder_point,
        } = validationResult.data;

        // --- Backend Validations (Duplicate Name, Category Check) ---
        const { data: existingItem, error: duplicateCheckError } =
            await supabase
                .from("InventoryItems")
                .select("id")
                .ilike("item_name", itemName) // Case-insensitive match
                .maybeSingle();

        if (duplicateCheckError) {
            console.error(
                "API Error: Duplicate check failed:",
                duplicateCheckError
            );
            return createErrorResponse(
                "Database error checking for duplicates",
                500
            );
        }
        if (existingItem) {
            return createErrorResponse(
                "Conflict: Item name already exists",
                409
            );
        }

        // 2. Validate categoryId if provided
        if (categoryId) {
            const { data: categoryExists, error: categoryCheckError } =
                await supabase
                    .from("categories")
                    .select("id")
                    .eq("id", categoryId)
                    .maybeSingle();

            if (categoryCheckError) {
                console.error(
                    "API Error: Category check failed:",
                    categoryCheckError
                );
                return createErrorResponse(
                    "Database error checking category",
                    500
                );
            }
            if (!categoryExists) {
                return createErrorResponse("Category not found", 404);
            }
        }
        // --- End Backend Validations ---

        // --- Item Insertion ---
        let finalItemData: Database["public"]["Tables"]["InventoryItems"]["Row"]; // Type for the resulting item data

        // 1. Insert the base item details, setting stock to 0 initially.
        //    Set avg/last price ONLY if initial stock is being added immediately after.
        const { data: insertedItem, error: insertError } = await supabase
            .from("InventoryItems")
            .insert({
                item_name: itemName,
                description: description,
                category_id: categoryId,
                unit,
                selling_price: sellingPrice, // Set initial selling price
                stock_quantity: 0, // Start with 0, RPC will update if needed
                reorder_point: reorder_point,
                user_id: user.id,
                // These fields are required by the database schema
                initial_purchase_price: initialPurchasePrice || 0,
                // Set initial derived prices only if stock is > 0
                last_purchase_price:
                    initialStock > 0 && initialPurchasePrice !== null
                        ? initialPurchasePrice
                        : null,
                average_purchase_price:
                    initialStock > 0 && initialPurchasePrice !== null
                        ? initialPurchasePrice
                        : null,
            })
            .select() // Select the newly inserted row
            .single(); // Expect only one row

        if (insertError) {
            console.error(
                "API Error: Failed to insert base item:",
                insertError
            );
            if (insertError.code === "23505")
                return createErrorResponse(
                    "Conflict: Item name exists (DB)",
                    409
                );
            if (insertError.code === "23503")
                return createErrorResponse("Category not found (DB)", 404);
            throw insertError; // Let general handler catch other DB errors
        }
        if (!insertedItem) {
            // Should not happen if insertError is null
            return createErrorResponse(
                "Failed to retrieve created item data after insert",
                500
            );
        }

        finalItemData = insertedItem; // Store the initially inserted data

        // 2. If initial stock exists, call the RPC function to update stock and log transaction
        if (
            initialStock > 0 &&
            initialPurchasePrice !== null &&
            initialPurchasePrice !== undefined
        ) {
            const { error: rpcError } = await supabase.rpc(
                "record_item_purchase",
                {
                    p_item_id: insertedItem.id,
                    p_quantity_added: initialStock,
                    p_purchase_price: initialPurchasePrice,
                    p_user_id: user.id,
                    p_transaction_type: "initial-stock" as TransactionType,
                    p_reference_number: "", // Empty string instead of null
                    p_reason: "Initial stock addition",
                    p_transaction_date: new Date().toISOString(), // Use current time
                }
            ); // Don't select single here, function returns SETOF

            if (rpcError) {
                console.error(
                    "API Error: Failed to record initial stock via RPC:",
                    rpcError
                );
                // Consider cleanup or manual correction if RPC fails after insert
                return createErrorResponse(
                    "Failed to record initial stock",
                    500,
                    rpcError.message
                );
            }

            // If RPC succeeded, fetch the latest item state to return
            const { data: latestItemData, error: fetchLatestError } =
                await supabase
                    .from("InventoryItems")
                    .select(`*, categories (id, name)`) // Fetch with category again if needed
                    .eq("id", insertedItem.id)
                    .single();

            if (fetchLatestError || !latestItemData) {
                console.error(
                    "API Warning: Could not fetch latest item data after RPC success:",
                    fetchLatestError
                );
                // Return the initially inserted data as fallback
            } else {
                // Update finalItemData with the latest data
                finalItemData = latestItemData;
            }
        }

        // Prepare the response item with category_name
        const responseItem = {
            ...finalItemData,
            // Add category_name based on the available data
            category_name: "Uncategorized", // Default value
        };

        // Try to get category name from categories relation if it exists
        if (
            "categories" in finalItemData &&
            finalItemData.categories &&
            typeof finalItemData.categories === "object" &&
            finalItemData.categories !== null &&
            "name" in finalItemData.categories &&
            typeof finalItemData.categories.name === "string"
        ) {
            responseItem.category_name = finalItemData.categories.name;
        } else if (categoryId) {
            // If no categories relation but we have categoryId, fetch it
            const { data: category } = await supabase
                .from("categories")
                .select("name")
                .eq("id", categoryId)
                .single();
            if (category && category.name) {
                responseItem.category_name = category.name;
            }
        }

        // Remove the categories property if it exists
        if ("categories" in responseItem) {
            delete responseItem.categories;
        }

        // --- Audit Logging (Optional) ---
        try {
            await supabase.from("AuditLogs").insert({
                user_id: user.id,
                action: "CREATE_ITEM",
                entity: "InventoryItems",
                entity_id: finalItemData.id.toString(), // Convert potential UUID to string
                details: {
                    // Store relevant creation data
                    itemName,
                    description,
                    categoryId,
                    unit,
                    sellingPrice,
                    initialStock,
                    initialPurchasePrice,
                    reorder_point, // Add reorder_point to audit log
                },
            });
        } catch (auditError) {
            console.error(
                "API Warning: Failed to insert audit log:",
                auditError
            );
            // Do not fail the request if audit logging fails, but log it
        }
        // --- End Audit Logging ---

        // Return success response with the created item's ID
        return NextResponse.json(
            {
                message: "Item created successfully",
                item: responseItem, // Return the final item data
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error(
            "API Error: Unexpected error in POST /api/inventory/items:",
            error
        );
        const message =
            error instanceof Error
                ? error.message
                : "An unexpected server error occurred";
        // Avoid sending detailed DB error messages in production for security
        const displayMessage =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code.startsWith("23")
                ? "Database constraint violation."
                : message;
        return createErrorResponse(displayMessage, 500);
    }
}
