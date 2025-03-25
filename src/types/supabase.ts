export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    description: string | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    description?: string | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string | null;
                };
            };
            inventory_items: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    description: string | null;
                    category_id: string;
                    quantity: number;
                    unit_price: number;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    description?: string | null;
                    category_id: string;
                    quantity: number;
                    unit_price: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string | null;
                    category_id?: string;
                    quantity?: number;
                    unit_price?: number;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
