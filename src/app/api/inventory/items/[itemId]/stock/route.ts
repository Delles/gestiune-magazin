import { NextRequest, NextResponse } from "next/server";
import { stockAdjustmentSchema } from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

interface RouteParams {
    params: {
        itemId: string;
    };
}

// POST handler for adjusting inventory item stock
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    noStore();
    try {
        // Wait for params to ensure they're available
        const { itemId } = await params;

        // Parse request body
        const body = await request.json();

        // Validate request body
        const validationResult = stockAdjustmentSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: "Invalid request data",
                    errors: validationResult.error.errors,
                },
                { status: 400 }
            );
        }

        const {
            quantity,
            type,
            transactionType,
            reason,
            date,
            purchasePrice,
            sellingPrice,
            totalPrice,
            referenceNumber,
        } = validationResult.data;

        // Create Supabase client
        const supabase = await createRouteHandlerSupabaseClient();

        // Check if user is authenticated
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user?.id;

        // Get current stock quantity
        const { data: item, error: fetchError } = await supabase
            .from("InventoryItems")
            .select("stock_quantity, item_name")
            .eq("id", itemId)
            .single();

        if (fetchError || !item) {
            return NextResponse.json(
                { message: "Item not found" },
                { status: 404 }
            );
        }

        // Calculate new stock quantity - stock_quantity is a numeric field in the database
        const currentStock = Number(item.stock_quantity);
        let newQuantity: number;
        let quantityChange: number;

        if (type === "increase") {
            newQuantity = currentStock + quantity;
            quantityChange = quantity; // Positive for increases
        } else {
            // Check if there's enough stock to decrease
            if (currentStock < quantity) {
                return NextResponse.json(
                    { message: "Not enough stock available" },
                    { status: 400 }
                );
            }
            newQuantity = currentStock - quantity;
            quantityChange = -quantity; // Negative for decreases
        }

        // Update stock quantity - stock_quantity accepts a number in the database (numeric type)
        const { error: updateError } = await supabase
            .from("InventoryItems")
            .update({
                stock_quantity: newQuantity,
                updated_at: new Date().toISOString(),
            })
            .eq("id", itemId);

        if (updateError) {
            console.error("Error updating stock quantity:", updateError);
            return NextResponse.json(
                { message: "Failed to update stock quantity" },
                { status: 500 }
            );
        }

        // Log the stock transaction
        const { error: logError } = await supabase
            .from("StockTransactions")
            .insert({
                item_id: itemId,
                transaction_type: transactionType,
                quantity_change: quantityChange,
                reason: reason || null,
                purchase_price: purchasePrice || null,
                selling_price: sellingPrice || null,
                total_price: totalPrice || null,
                reference_number: referenceNumber || null,
                created_at:
                    date instanceof Date
                        ? date.toISOString()
                        : new Date().toISOString(),
                user_id: userId,
                notes: null,
            });

        if (logError) {
            console.error("Error logging stock transaction:", logError);
            // We don't want to fail the whole operation if just the logging fails
            // But we should log this error for monitoring
        }

        return NextResponse.json({
            message: `Stock ${
                type === "increase" ? "increased" : "decreased"
            } successfully`,
            newQuantity,
        });
    } catch (error) {
        console.error("Error adjusting stock:", error);
        return NextResponse.json(
            { message: "An error occurred while adjusting stock" },
            { status: 500 }
        );
    }
}
