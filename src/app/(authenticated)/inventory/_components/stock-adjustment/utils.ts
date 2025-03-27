import { type TransactionType } from "@/lib/validation/inventory-schemas";
import { type StockAdjustmentFormValues } from "@/lib/validation/inventory-schemas";

// Group transaction types by increase/decrease
export const INCREASE_TYPES: TransactionType[] = [
    "purchase",
    "return",
    "inventory-correction-add",
    "other-addition",
];

export const DECREASE_TYPES: TransactionType[] = [
    "sale",
    "damaged",
    "loss",
    "expired",
    "inventory-correction-remove",
    "other-removal",
];

// Helper function to determine if a transaction type needs price fields
export function needsPriceFields(transactionType: TransactionType): boolean {
    return [
        "purchase",
        "sale",
        "return",
        "damaged",
        "expired",
        "loss",
    ].includes(transactionType);
}

// Function to adjust stock for an inventory item
export async function adjustStock(
    itemId: string,
    data: StockAdjustmentFormValues
): Promise<{ message: string }> {
    const response = await fetch(`/api/inventory/items/${itemId}/stock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to adjust stock");
    }

    return response.json();
}

// Interface for form props
export interface StockAdjustmentFormProps {
    itemId: string;
    itemName: string;
    unit: string;
    currentStock: number;
    onSuccess?: () => void;
    initialType?: "increase" | "decrease";
}
