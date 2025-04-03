import { toast } from "sonner";
import { InventoryItem, Category, StockTransaction } from "../types/types"; // Uses the existing type path
import type {
    InventoryItemCreateFormValues,
    InventoryItemUpdateFormValues,
} from "@/lib/validation/inventory-schemas";

export async function getInventoryItems(): Promise<InventoryItem[]> {
    const response = await fetch("/api/inventory/items");
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Failed to fetch inventory items: ${response.status} ${
                errorText || response.statusText
            }`
        );
    }
    const data = await response.json();
    // Add type assertion or validation if needed, though fetch returns any/unknown
    return data as InventoryItem[];
}

export async function getCategories(): Promise<Category[]> {
    const response = await fetch("/api/categories");
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Failed to fetch categories: ${response.status} ${
                errorText || response.statusText
            }`
        );
    }
    const data = await response.json();
    // Add type assertion or validation if needed
    return data as Category[];
}

/**
 * Deletes inventory items by their IDs.
 * Throws an error if any deletion fails. Individual errors are toasted.
 * @param itemIds - Array of item IDs to delete.
 */
export async function deleteInventoryItems(itemIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
        itemIds.map(async (id) => {
            // Make inner function async for await
            const response = await fetch(`/api/inventory/items/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorText = await response.text();
                // Throw specific error for this ID
                throw new Error(
                    `Failed for ID ${id}: ${response.status} ${
                        errorText || response.statusText
                    }`
                );
            }
            // Optionally return something on success if needed, otherwise implicit undefined is fine
            // return await response.json(); // If the API returns something useful
        })
    );

    const errors = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    // const successes = results.filter((r) => r.status === "fulfilled");

    // Toast individual errors
    errors.forEach((e) => {
        toast.error(
            `Failed to delete an item: ${
                (e.reason as Error)?.message || "Unknown error"
            }`
        );
    });

    // If any errors occurred, throw a consolidated error after handling individual ones
    if (errors.length > 0) {
        const errorMessages = errors
            .map((e) => (e.reason as Error)?.message || "Unknown reason")
            .join("; ");
        throw new Error(
            `Some items failed to delete. Errors: ${errorMessages}`
        );
    }
}

// Function to fetch an inventory item by ID
export async function getInventoryItem(id: string): Promise<InventoryItem> {
    const response = await fetch(`/api/inventory/items/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error("Item not found");
        // Consider more specific error handling based on status codes
        const errorText = await response.text();
        throw new Error(
            `Failed to fetch item ${id}: ${response.status} ${
                errorText || response.statusText
            }`
        );
    }
    const data = await response.json();
    return data as InventoryItem; // Assuming API returns correct shape
}

// Function to create a new inventory item
export async function createInventoryItem(data: InventoryItemCreateFormValues) {
    const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Graceful error parsing
        throw new Error(
            errorData.message || errorData.error || "Failed to create item"
        );
    }
    return response.json(); // Return the parsed JSON response (e.g., { message: string, item: InventoryItem })
}

// Function to update an existing inventory item
export async function updateInventoryItem(
    id: string,
    data: Omit<InventoryItemUpdateFormValues, "id">
) {
    const response = await fetch(`/api/inventory/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Graceful error parsing
        throw new Error(
            errorData.message ||
                errorData.error ||
                `Failed to update item ${id}`
        );
    }
    return response.json(); // Return the parsed JSON response
}

// Function to fetch stock transactions for an item
export async function getStockTransactions(
    itemId: string
): Promise<StockTransaction[]> {
    const response = await fetch(`/api/inventory/items/${itemId}/transactions`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Failed to fetch transactions for item ${itemId}: ${
                response.status
            } ${errorText || response.statusText}`
        );
    }
    const data = await response.json();
    return data as StockTransaction[]; // Assuming API returns correct shape
}

// Function to update only the reorder point for an item
export async function updateItemReorderPoint(
    id: string,
    reorder_point: number | null
): Promise<{ id: string; reorder_point: number | null }> {
    const response = await fetch(`/api/inventory/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder_point }), // Only send reorder_point
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message ||
                errorData.error ||
                `Failed to update reorder point for item ${id}`
        );
    }
    return response.json(); // API should return { id, reorder_point }
}
