import { NextRequest, NextResponse } from "next/server";
import {
    stockAdjustmentSchema,
    TransactionType,
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

        // Fix: Use StockAdjustmentFormValues for validation data type
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

        // Use validated data
        const {
            quantity = 0, // Default to 0 if undefined
            transactionType,
            reason,
            date,
            purchasePrice, // Price for 'purchase'/'return'
            sellingPrice, // Price for 'sale'/'damaged' etc.
            totalPrice, // Calculated or entered
            referenceNumber,
        } = validationResult.data;

        // Ensure quantity is a number for calculations
        const adjustmentQuantity = Number(quantity);
        if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
            return createErrorResponse(
                "Invalid quantity. Must be a positive number.",
                400
            );
        }

        const supabase = await createRouteHandlerSupabaseClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return createErrorResponse("Unauthorized", 401);
        }
        const userId = session.user?.id;

        // --- Logic Branching ---

        // Case 1: Purchase or Return (Use RPC Function)
        if (
            transactionType === "purchase" ||
            (transactionType as string) === "return"
        ) {
            // Ensure purchasePrice is valid
            if (
                purchasePrice === null ||
                purchasePrice === undefined ||
                purchasePrice < 0
            ) {
                return createErrorResponse(
                    "Valid Purchase Price is required for 'purchase' or 'return' transactions.",
                    400
                );
            }

            const { error: rpcError } = await supabase.rpc(
                "record_item_purchase",
                {
                    p_item_id: itemId,
                    p_quantity_added: adjustmentQuantity, // Function expects positive quantity
                    p_purchase_price: purchasePrice,
                    p_user_id: userId,
                    p_transaction_type: transactionType as TransactionType, // Cast to TransactionType
                    p_reference_number: referenceNumber || "", // Convert null to empty string
                    p_reason: reason || "", // Convert null to empty string
                    p_transaction_date:
                        date instanceof Date
                            ? date.toISOString()
                            : new Date().toISOString(), // Handle both Date and string
                }
            );

            if (rpcError) {
                console.error(
                    `Error calling record_item_purchase for item ${itemId}:`,
                    rpcError
                );
                return createErrorResponse(
                    "Failed to record purchase transaction",
                    500,
                    rpcError.message
                );
            }

            // Since RPC returns SETOF, rpcResult might be an array. Assuming single item update.
            // We ideally want the updated item details back.
            const { data: updatedItem, error: fetchError } = await supabase
                .from("InventoryItems")
                .select(`*, categories(id, name)`) // Fetch needed details
                .eq("id", itemId)
                .single();

            if (fetchError || !updatedItem) {
                console.warn(
                    "Could not fetch item details after successful RPC call."
                );
                return NextResponse.json({
                    message: `Stock adjusted via ${transactionType}, but failed to fetch final state.`,
                });
            }
            const transformedItem = {
                ...updatedItem,
                category_name: updatedItem.categories?.name || "Uncategorized",
                categories: undefined,
            };

            return NextResponse.json({
                message: `Stock adjusted successfully via ${transactionType}`,
                newQuantity: transformedItem.stock_quantity,
                item: transformedItem, // Return updated item data
            });
        } else {
            // Case 2: Other Transaction Types (Manual Update - Non-Purchase/Return)

            // Start DB transaction (optional but safer if multiple steps needed)
            // const { data: txnData, error: txnError } = await supabase.rpc('some_wrapper_for_transaction');
            // If not using DB transaction, ensure error handling is robust

            // Get current stock quantity
            const { data: item, error: fetchError } = await supabase
                .from("InventoryItems")
                .select("stock_quantity") // Select only needed field
                .eq("id", itemId)
                .single();

            if (fetchError || !item) {
                if (fetchError?.code === "PGRST116")
                    return createErrorResponse("Item not found", 404); // Handle specific 'not found' error
                console.error(
                    `Error fetching item ${itemId} for manual adjustment:`,
                    fetchError
                );
                return createErrorResponse(
                    "Failed to fetch item before adjustment",
                    500
                );
            }

            const currentStock = Number(item.stock_quantity);
            let newQuantity: number;
            let quantityChange: number;

            // Determine quantity change based on transaction type category ('increase' or 'decrease')
            const isIncrease = [
                "inventory-correction-add",
                "other-addition",
            ].includes(transactionType);
            const isDecrease = [
                "sale",
                "write-off",
                "inventory-correction-remove",
                "other-removal",
            ].includes(transactionType);

            if (isIncrease) {
                newQuantity = currentStock + adjustmentQuantity;
                quantityChange = adjustmentQuantity;
            } else if (isDecrease) {
                if (currentStock < adjustmentQuantity) {
                    return createErrorResponse(
                        "Not enough stock available for decrease",
                        400
                    );
                }
                newQuantity = currentStock - adjustmentQuantity;
                quantityChange = -adjustmentQuantity;
            } else {
                // This check should now correctly handle write-off if isDecrease logic is right
                return createErrorResponse(
                    `Invalid transaction type for manual adjustment: ${transactionType}`,
                    400
                );
            }

            // Update stock quantity only
            const { data: updateData, error: updateError } = await supabase
                .from("InventoryItems")
                .update({
                    stock_quantity: newQuantity,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", itemId)
                .select("stock_quantity") // Select the updated quantity
                .single();

            if (updateError) {
                console.error(
                    `Error updating stock quantity manually for item ${itemId}:`,
                    updateError
                );
                return createErrorResponse(
                    "Failed to update stock quantity",
                    500
                );
            }

            const finalQuantity = updateData?.stock_quantity; // Get the quantity confirmed by the DB

            // Log the stock transaction
            const { error: logError } = await supabase
                .from("StockTransactions")
                .insert({
                    item_id: itemId,
                    transaction_type: transactionType, // Use the validated type (e.g., 'write-off')
                    quantity_change: quantityChange,
                    reason: reason || null,
                    transaction_date:
                        date instanceof Date
                            ? date.toISOString()
                            : new Date().toISOString(),
                    user_id: userId, // Use correct column name and variable
                    // Include price/cost info based on transaction type
                    purchase_price:
                        transactionType === "write-off"
                            ? purchasePrice // Use validated camelCase variable for value
                            : null,
                    selling_price:
                        transactionType === "sale"
                            ? sellingPrice // Use validated camelCase variable for value
                            : null,
                    total_price: totalPrice, // Use correct column name and variable
                    reference_number: referenceNumber, // Use correct column name and variable
                })
                .select() // Select to potentially get the inserted row ID if needed
                .single(); // Assuming we insert one row

            if (logError) {
                console.error(
                    `Error logging stock transaction for item ${itemId}:`,
                    logError
                );
                // Decide if this should cause the entire operation to fail
                // For now, we'll return success but log the error
                // return createErrorResponse("Failed to log stock transaction after update", 500);
            }

            // Fetch the final item details AFTER the update and log
            const { data: finalItemData, error: finalFetchError } =
                await supabase
                    .from("InventoryItems")
                    .select(`*, categories(id, name)`)
                    .eq("id", itemId)
                    .single();

            if (finalFetchError || !finalItemData) {
                console.warn(
                    "Could not fetch item details after successful stock adjustment."
                );
                // Return success but without the updated item details
                return NextResponse.json({
                    message: `Stock adjusted successfully via ${transactionType}, but failed to fetch final state.`,
                    newQuantity: finalQuantity, // Return the quantity confirmed by the update
                });
            }

            // Prepare item data for response (similar to purchase branch)
            const transformedFinalItem = {
                ...finalItemData,
                category_name:
                    finalItemData.categories?.name || "Uncategorized",
                categories: undefined,
            };

            return NextResponse.json({
                message: `Stock adjusted successfully via ${transactionType}`,
                newQuantity: transformedFinalItem.stock_quantity, // Use quantity from final fetched item
                item: transformedFinalItem, // Return updated item data
            });
        }
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
