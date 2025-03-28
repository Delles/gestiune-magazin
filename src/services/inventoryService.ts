import { type StockAdjustmentFormValues } from "@/lib/validation/inventory-schemas";

// Define a more specific return type if known, otherwise use a generic object
interface StockAdjustmentApiResponse {
    message: string;
    // Add other fields returned by your API if necessary
}

/**
 * Adjusts the stock for a specific inventory item.
 * Sends a POST request to the backend API.
 *
 * @param itemId - The ID of the inventory item to adjust.
 * @param values - The stock adjustment data validated by Zod.
 * @returns The result from the API.
 * @throws Error if the API request fails.
 */
export async function adjustInventoryItemStock(
    itemId: string,
    values: StockAdjustmentFormValues
): Promise<StockAdjustmentApiResponse> {
    const response = await fetch(`/api/inventory/items/${itemId}/stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
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
