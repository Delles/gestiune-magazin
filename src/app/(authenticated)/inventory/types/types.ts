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

type StockTransaction = {
    id: string;
    item_id: string;
    transaction_type: string;
    quantity_change: number;
    reason: string | null;
    created_at: string;
    user_id: string | null;
    notes: string | null;
    user_name?: string; // Typically joined from a users table
    purchase_price: number | null;
    selling_price: number | null;
    total_price: number | null;
    reference_number: string | null;
};

export type { InventoryItem, Category, StockTransaction };
