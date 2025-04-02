// Define types
type InventoryItem = {
    id: string;
    item_name: string;
    category_id: string | null;
    category_name?: string;
    unit: string;
    initial_purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_point: number | null; // Ensure this is present
    description: string | null; // ADD description field
    created_at: string;
    updated_at: string;
    last_purchase_price: number | null; // NEW
    average_purchase_price: number | null; // NEW
};

type Category = {
    id: string;
    name: string;
};

export type { InventoryItem, Category };
