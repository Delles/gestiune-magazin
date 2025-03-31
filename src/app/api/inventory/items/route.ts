import { NextRequest, NextResponse } from "next/server";
import { inventoryItemCreateSchema } from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

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
                "API Validation Error:",
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
            purchasePrice,
            sellingPrice,
            initialStock,
            reorder_point,
        } = validationResult.data;

        // --- Start Backend Validations ---

        // 1. Check for duplicate item name (case-insensitive)
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
            return createErrorResponse("Conflict", 409, {
                itemName: "An item with this name already exists.",
            });
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
                return createErrorResponse("Category not found", 404, {
                    categoryId: `Category with ID ${categoryId} not found.`,
                });
            }
        }

        // --- End Backend Validations ---

        // Insert the new item with fields that match the DB schema
        const { data: newItemData, error: insertError } = await supabase
            .from("InventoryItems")
            .insert({
                item_name: itemName,
                description: description,
                category_id: categoryId, // Will be null if not provided
                unit,
                purchase_price: purchasePrice,
                selling_price: sellingPrice,
                stock_quantity: initialStock,
                reorder_point: reorder_point, // Add reorder_point field
                user_id: user.id, // Associate with the user
            })
            .select() // Select the newly inserted row
            .single(); // Expect only one row back

        if (insertError) {
            console.error("API Error: Failed to insert item:", insertError);
            // Handle potential DB constraint errors more specifically if needed
            if (insertError.code === "23505") {
                // Unique constraint violation (fallback)
                return createErrorResponse("Conflict", 409, {
                    itemName: "Item name already exists (database constraint).",
                });
            }
            if (insertError.code === "23503") {
                // Foreign key violation (fallback)
                return createErrorResponse(
                    "Category not found (database constraint)",
                    404,
                    { categoryId: "Invalid category reference." }
                );
            }
            return createErrorResponse("Failed to create inventory item", 500);
        }

        if (!newItemData) {
            // Should not happen if insertError is null, but good to check
            console.error("API Error: Insert succeeded but no data returned.");
            return createErrorResponse(
                "Failed to retrieve created item data",
                500
            );
        }

        // --- Audit Logging ---
        try {
            await supabase.from("AuditLogs").insert({
                user_id: user.id,
                action: "CREATE_ITEM",
                entity: "InventoryItems",
                entity_id: newItemData.id.toString(), // Convert potential UUID to string
                details: {
                    // Store relevant creation data
                    itemName,
                    description,
                    categoryId,
                    unit,
                    purchasePrice,
                    sellingPrice,
                    initialStock,
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
                item: newItemData, // Return the full created item
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error(
            "API Error: Unexpected error in POST /api/inventory/items:",
            error
        );
        return createErrorResponse(
            error instanceof Error
                ? error.message
                : "An unexpected server error occurred",
            500
        );
    }
}
