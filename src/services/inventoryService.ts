import {
    type StockAdjustmentFormValues,
    type IncreaseStockFormValues,
    type DecreaseStockFormValues,
} from "@/lib/validation/inventory-schemas";

// Define a more specific return type if known, otherwise use a generic object
interface StockAdjustmentApiResponse {
    message: string;
    newQuantity?: number;
    item?: Record<string, unknown>;
}

/**
 * Adjusts the stock for a specific inventory item.
 * Supports both IncreaseStockForm and DecreaseStockForm data.
 * Directly uses the transaction types from the form.
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
    // Initialize with common values
    const commonApiValues = {
        quantity: values.quantity,
        date: values.date,
        referenceNumber: values.referenceNumber || null,
        reason: values.reason || null,
    };

    // Directly use the transaction type from the form
    const apiTransactionType = values.transactionType;
    let apiPriceFields: Partial<StockAdjustmentFormValues> = {};

    // Determine which price fields to include based on the transaction type
    if (apiTransactionType === "purchase" && "purchasePrice" in values) {
        apiPriceFields = {
            purchasePrice: values.purchasePrice,
            totalPrice: values.totalCost,
        };
    } else if (apiTransactionType === "sale" && "sellingPrice" in values) {
        apiPriceFields = {
            sellingPrice: values.sellingPrice,
            totalPrice: values.totalValue,
        };
    } else if (apiTransactionType === "write-off" && "itemCost" in values) {
        apiPriceFields = {
            purchasePrice: values.itemCost,
            totalPrice: values.totalValue,
        };
    } else if (
        apiTransactionType === "correction-add" &&
        "totalCost" in values
    ) {
        apiPriceFields = {
            totalPrice: values.totalCost,
        };
    } else if (
        apiTransactionType === "correction-remove" &&
        "totalValue" in values
    ) {
        apiPriceFields = {
            totalPrice: values.totalValue,
        };
    }
    // Price fields will be null/undefined if not applicable or not provided in the form

    // Combine common values, transaction type, and specific price fields
    const apiPayload: Partial<StockAdjustmentFormValues> = {
        ...commonApiValues,
        transactionType: apiTransactionType,
        ...apiPriceFields,
    };

    // Clean up nullish price fields before sending to API
    Object.keys(apiPayload).forEach((key) => {
        const fieldKey = key as keyof typeof apiPayload;
        if (
            apiPayload[fieldKey] === null ||
            apiPayload[fieldKey] === undefined
        ) {
            if (["purchasePrice", "sellingPrice", "totalPrice"].includes(key)) {
                delete apiPayload[fieldKey];
            }
        }
    });

    console.log(
        "Sending to API (Service):",
        JSON.stringify(apiPayload, null, 2)
    );

    const response = await fetch(`/api/inventory/items/${itemId}/stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
            console.error("API Error Response (Service):", errorData);
        } catch {
            console.error(
                "Failed to parse error response JSON (Service). Status:",
                response.status,
                response.statusText
            );
            errorData = {
                message: `Request failed with status ${response.status}: ${response.statusText}`,
            };
        }
        const errorMessage =
            errorData?.error ||
            errorData?.message ||
            `Failed to adjust stock. Status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return response.json() as Promise<StockAdjustmentApiResponse>;
}
