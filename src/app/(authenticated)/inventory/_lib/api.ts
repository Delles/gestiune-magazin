import { toast } from "sonner";
import { InventoryItem, Category } from "../types/types"; // Uses the existing type path

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
