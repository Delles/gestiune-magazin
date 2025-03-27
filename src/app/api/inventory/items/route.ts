import { NextRequest, NextResponse } from "next/server";
import { inventoryItemSchema } from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

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
            return NextResponse.json(
                {
                    message: "Failed to fetch inventory items",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        // Transform the data to include category_name
        const transformedData = data.map((item) => ({
            ...item,
            category_name: item.categories?.name || "Uncategorized",
            categories: undefined, // Remove the categories object
        }));

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error("Unexpected error fetching inventory items:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// POST handler for creating a new inventory item
export async function POST(request: NextRequest) {
    noStore(); // Prevent caching
    try {
        // Parse the request body
        const body = await request.json();

        // Validate the request body against our schema
        const validationResult = inventoryItemSchema.safeParse(body);
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
            unit,
            purchasePrice,
            sellingPrice,
            initialStock,
        } = validationResult.data;

        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Get the current user
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

        // Insert the new item
        const { data, error } = await supabase
            .from("InventoryItems")
            .insert({
                item_name: itemName,
                category_id: categoryId,
                unit,
                purchase_price: purchasePrice,
                selling_price: sellingPrice,
                stock_quantity: initialStock, // Use initialStock for stock_quantity
                // Add user_id for RLS policies
                user_id: user.id,
            })
            .select();

        if (error) {
            console.error("Error creating inventory item:", error);
            return NextResponse.json(
                {
                    message: "Failed to create inventory item",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data[0], { status: 201 });
    } catch (error) {
        console.error("Unexpected error creating inventory item:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
