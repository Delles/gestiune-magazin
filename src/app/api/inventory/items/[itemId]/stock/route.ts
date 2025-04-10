import { NextRequest, NextResponse } from "next/server";
import {
    stockAdjustmentSchema,
    StockAdjustmentTransactionType,
} from "@/lib/validation/inventory-schemas";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

interface RouteParams {
    params: Promise<{
        itemId: string;
    }>;
}

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

// POST handler for adjusting inventory item stock
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    noStore();
    try {
        const { itemId } = await params;
        const body = await request.json();

        // 1. Validate the incoming request body thoroughly
        const validationResult = stockAdjustmentSchema.safeParse(body);

        if (!validationResult.success) {
            console.log(
                "API Validation Error (Stock Adjust):",
                validationResult.error.flatten()
            );
            return createErrorResponse(
                "Invalid request data",
                400,
                validationResult.error.flatten().fieldErrors
            );
        }

        // 2. Get validated data
        const {
            quantity,
            transactionType, // Type from form: 'purchase', 'sale', 'write-off', 'correction-add', 'correction-remove'
            reason,
            date,
            purchasePrice, // Price for 'purchase' OR cost for 'write-off'
            sellingPrice, // Price for 'sale'
            totalPrice, // Can be total cost or total sale value
            referenceNumber,
        } = validationResult.data;

        // 3. Get authenticated user
        const supabase = await createRouteHandlerSupabaseClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            // Check for user ID specifically
            return createErrorResponse("Unauthorized", 401);
        }
        const userId = session.user.id;

        // 4. Determine the quantity_change (+/-) for the RPC function
        let quantityChange: number;
        const isIncrease = [
            "purchase",
            "correction-add",
            // Add 'return' here if/when implemented in the form/schema
        ].includes(transactionType);
        const isDecrease = [
            "sale",
            "write-off",
            "correction-remove",
            // Add 'damaged', 'loss', 'expired' etc. if they become distinct types later
        ].includes(transactionType);

        if (isIncrease) {
            quantityChange = quantity; // Positive value
        } else if (isDecrease) {
            quantityChange = -quantity; // Negative value
        } else {
            // Should not happen if validation is correct, but good practice
            return createErrorResponse(
                `Unsupported transaction type: ${transactionType}`,
                400
            );
        }

        // 5. Prepare parameters for the RPC call (match SQL function signature)
        const rpcParams = {
            p_item_id: itemId,
            p_quantity_change: quantityChange, // Use the signed quantity change
            p_transaction_type:
                transactionType as StockAdjustmentTransactionType, // Ensure type matches DB enum if needed
            p_user_id: userId,
            p_transaction_date:
                date instanceof Date
                    ? date.toISOString()
                    : new Date(date).toISOString(), // Ensure ISO string
            p_reason: reason || undefined, // Use undefined instead of null
            p_reference_number: referenceNumber || undefined, // Use undefined instead of null
            // Pass prices based on context (RPC function might ignore irrelevant ones)
            p_purchase_price: purchasePrice ?? undefined, // Use undefined instead of null
            p_selling_price: sellingPrice ?? undefined, // Use undefined instead of null
            p_total_price: totalPrice ?? undefined, // Use undefined instead of null
        };

        // 6. Call the single RPC function
        console.log(`Calling adjust_stock RPC with params:`, rpcParams); // Debug log
        const { data: rpcResult, error: rpcError } = await supabase
            .rpc("adjust_stock", rpcParams)
            .select()
            .single(); // Expecting a single updated item row back

        if (rpcError) {
            console.error(
                `Error calling adjust_stock RPC for item ${itemId}:`,
                rpcError
            );
            // Check for specific database exceptions (like insufficient stock)
            if (rpcError.message.includes("Insufficient stock")) {
                return createErrorResponse(
                    "Insufficient stock",
                    400,
                    rpcError.details
                );
            }
            if (rpcError.message.includes("not found")) {
                return createErrorResponse(
                    "Item not found",
                    404,
                    rpcError.details
                );
            }
            // Generic error for others
            return createErrorResponse(
                "Failed to adjust stock",
                500,
                rpcError.message // Provide DB error message for debugging
            );
        }

        if (!rpcResult) {
            console.error(
                `adjust_stock RPC for item ${itemId} returned no data.`
            );
            return createErrorResponse(
                "Failed to retrieve item data after adjustment",
                500
            );
        }

        // 7. Process the successful result (optional: fetch category name if needed)
        const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .select("name")
            .eq("id", rpcResult.category_id)
            .maybeSingle();

        if (categoryError) {
            console.warn(
                `Could not fetch category name for item ${itemId} after adjustment: ${categoryError.message}`
            );
        }

        const transformedItem = {
            ...rpcResult,
            category_name: categoryData?.name || "Uncategorized",
            // categories: undefined, // Remove if categories relation was included in RPC return type accidentally
        };

        // 8. Return success response
        return NextResponse.json({
            message: "Stock adjusted successfully",
            newQuantity: transformedItem.stock_quantity, // Get the actual new quantity from DB
            item: transformedItem, // Return the full updated item details
        });
    } catch (error: unknown) {
        console.error("Unexpected error adjusting stock:", error);
        return createErrorResponse(
            error instanceof Error
                ? error.message
                : "An unexpected server error occurred",
            500
        );
    }
}
