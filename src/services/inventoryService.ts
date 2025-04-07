import {
    type StockAdjustmentFormValues,
    type IncreaseStockFormValues,
    type DecreaseStockFormValues,
    type StockAdjustmentTransactionType,
} from "@/lib/validation/inventory-schemas";

// Define a more specific return type if known, otherwise use a generic object
interface StockAdjustmentApiResponse {
    message: string;
    newQuantity?: number;
    item?: Record<string, unknown>;
}

// API transaction type mapping
const increaseTypeApiMap: Record<string, StockAdjustmentTransactionType> = {
    purchase: "purchase",
    "correction-add": "inventory-correction-add",
};

const decreaseTypeApiMap: Record<string, StockAdjustmentTransactionType> = {
    sale: "sale",
    "write-off": "damaged",
    "correction-remove": "inventory-correction-remove",
};

/**
 * Adjusts the stock for a specific inventory item.
 * Supports both IncreaseStockForm and DecreaseStockForm data.
 * Maps simplified form transaction types to API expected format.
 *
 * @param itemId - The ID of the inventory item to adjust.
 * @param values - The stock adjustment data from either form.
 * @returns The result from the API.
 * @throws Error if the API request fails.
 */
export async function adjustInventoryItemStock(
    itemId: string,
    values: IncreaseStockFormValues | DecreaseStockFormValues
): Promise<StockAdjustmentApiResponse> {
    // Map form values to API expected schema
    const apiValues: Partial<StockAdjustmentFormValues> = {
        quantity: values.quantity,
        date: values.date,
        referenceNumber: values.referenceNumber || null,
        reason: values.reason || null,
    };

    // Handle transaction type mapping based on form type
    if ("purchasePrice" in values) {
        // This is from IncreaseStockForm
        const formType =
            values.transactionType as keyof typeof increaseTypeApiMap;
        apiValues.transactionType = increaseTypeApiMap[formType] || "purchase";
        apiValues.purchasePrice = values.purchasePrice;
        apiValues.totalPrice = values.totalCost;
    } else if ("sellingPrice" in values) {
        // This is from DecreaseStockForm (old format)
        const formType =
            values.transactionType as keyof typeof decreaseTypeApiMap;
        apiValues.transactionType = decreaseTypeApiMap[formType] || "sale";
        apiValues.sellingPrice = values.sellingPrice;
        apiValues.totalPrice = values.totalValue;
    } else if ("itemCost" in values) {
        // This is from DecreaseStockForm with itemCost for write-offs
        const formType =
            values.transactionType as keyof typeof decreaseTypeApiMap;
        apiValues.transactionType = decreaseTypeApiMap[formType] || "damaged";

        // For write-offs, use itemCost as purchasePrice to track value lost
        if (values.transactionType === "write-off") {
            apiValues.purchasePrice = values.itemCost;
        } else {
            apiValues.sellingPrice = values.sellingPrice;
        }
        apiValues.totalPrice = values.totalValue;
    }

    const response = await fetch(`/api/inventory/items/${itemId}/stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(apiValues),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            // Log the parsing error for debugging if needed
            // console.error("Failed to parse error response:");
            // Handle cases where the response is not valid JSON
            errorData = {
                message: `Request failed with status ${response.status}: ${response.statusText}`,
            };
        }
        // Ensure errorData has a message property
        const errorMessage =
            errorData?.message ||
            `Failed to adjust stock. Status: ${response.status}`;
        throw new Error(errorMessage);
    }

    // Assuming the API returns JSON matching StockAdjustmentApiResponse on success
    return response.json() as Promise<StockAdjustmentApiResponse>;
}
