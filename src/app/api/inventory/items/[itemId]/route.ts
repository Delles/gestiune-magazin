import { NextRequest, NextResponse } from "next/server";
import {
    inventoryItemUpdateSchema,
    inventoryItemReorderPointUpdateSchema,
} from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

interface RouteParams {
    params: {
        itemId: string;
    };
}

// GET handler for fetching a specific inventory item
export async function GET(request: NextRequest, context: RouteParams) {
    noStore(); // Prevent caching
    try {
        // Await params in Next.js 15
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;

        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Query the specific inventory item with category data
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
            .eq("id", itemId)
            .single();

        if (error) {
            console.error(`Error fetching inventory item ${itemId}:`, error);
            return NextResponse.json(
                {
                    message: "Failed to fetch inventory item",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { message: "Inventory item not found" },
                { status: 404 }
            );
        }

        // Transform the data to include category_name
        const transformedData = {
            ...data,
            category_name: data.categories?.name || "Uncategorized",
            categories: undefined, // Remove the categories object
        };

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error("Unexpected error fetching inventory item:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// PUT handler for updating a specific inventory item
export async function PUT(request: NextRequest, context: RouteParams) {
    noStore(); // Prevent caching
    try {
        // Await params in Next.js 15
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;

        // Parse the request body
        const body = await request.json();

        // Validate the request body against our schema
        const validationResult = inventoryItemUpdateSchema.safeParse({
            ...body,
            id: itemId,
        });
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: "Invalid request data",
                    errors: validationResult.error.errors,
                },
                { status: 400 }
            );
        }

        // Extract the validated data
        const {
            itemName,
            categoryId,
            sellingPrice,
            reorder_point,
            description,
        } = validationResult.data;

        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Get the current user for RLS
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Error getting authenticated user:", userError);
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Update the inventory item with only the fields that exist in the DB schema
        const { data, error } = await supabase
            .from("InventoryItems")
            .update({
                item_name: itemName,
                category_id: categoryId,
                selling_price: sellingPrice,
                reorder_point: reorder_point,
                description: description,
                updated_at: new Date().toISOString(), // Explicitly set updated_at
            })
            .eq("id", itemId)
            .eq("user_id", user.id) // Ensure user owns the item via RLS check
            .select();

        if (error) {
            console.error(`Error updating inventory item ${itemId}:`, error);
            return NextResponse.json(
                {
                    message: "Failed to update inventory item",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (data.length === 0) {
            return NextResponse.json(
                { message: "Inventory item not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(data[0]);
    } catch (error) {
        console.error("Unexpected error updating inventory item:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// PATCH handler for updating only the reorder_point
export async function PATCH(request: NextRequest, context: RouteParams) {
    noStore(); // Prevent caching
    try {
        // Await params in Next.js 15
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;

        // Parse the request body
        const body = await request.json();

        // Validate the request body against the reorder point schema
        const validationResult =
            inventoryItemReorderPointUpdateSchema.safeParse(body);

        if (!validationResult.success) {
            console.error(
                `API Validation Error (PATCH Item ${itemId}):`,
                validationResult.error.flatten()
            );
            return NextResponse.json(
                {
                    message: "Invalid request data for reorder point update",
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        // Extract the validated reorder_point
        const { reorder_point } = validationResult.data;

        // Create a Supabase client
        const supabase = await createRouteHandlerSupabaseClient();

        // Get the current user for RLS
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Error getting authenticated user:", userError);
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Update only the reorder_point for the inventory item
        const { data, error } = await supabase
            .from("InventoryItems")
            .update({
                reorder_point: reorder_point,
                updated_at: new Date().toISOString(), // Always update timestamp
            })
            .eq("id", itemId)
            .eq("user_id", user.id) // RLS check
            .select("id, reorder_point") // Select only relevant fields
            .single(); // Expect one row

        if (error) {
            console.error(
                `Error partially updating inventory item ${itemId} (reorder_point):`,
                error
            );
            return NextResponse.json(
                {
                    message: "Failed to update item reorder point",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (!data) {
            // Should only happen if RLS fails or item doesn't exist
            return NextResponse.json(
                { message: "Inventory item not found or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(
            "Unexpected error partially updating inventory item:",
            error
        );
        return NextResponse.json(
            { message: "An unexpected server error occurred" },
            { status: 500 }
        );
    }
}

// DELETE handler for deleting a specific inventory item
export async function DELETE(request: NextRequest, context: RouteParams) {
    noStore(); // Prevent caching
    try {
        // Await params in Next.js 15
        const params = await Promise.resolve(context.params);
        const itemId = params.itemId;

        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Get the current user for RLS
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Error getting authenticated user:", userError);
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        // Delete the inventory item
        const { error } = await supabase
            .from("InventoryItems")
            .delete()
            .eq("id", itemId);

        if (error) {
            console.error(`Error deleting inventory item ${itemId}:`, error);
            return NextResponse.json(
                {
                    message: "Failed to delete inventory item",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Inventory item deleted successfully",
        });
    } catch (error) {
        console.error("Unexpected error deleting inventory item:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
