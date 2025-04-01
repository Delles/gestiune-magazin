export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      AuditLogs: {
        Row: {
          action: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      CurrencySettings: {
        Row: {
          created_at: string
          currency_code: string
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          id?: never
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: never
          updated_at?: string
        }
        Relationships: []
      }
      InventoryItems: {
        Row: {
          average_purchase_price: number | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          initial_purchase_price: number
          item_name: string
          last_purchase_price: number | null
          reorder_point: number | null
          selling_price: number
          stock_quantity: number
          unit: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          average_purchase_price?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_purchase_price: number
          item_name: string
          last_purchase_price?: number | null
          reorder_point?: number | null
          selling_price: number
          stock_quantity?: number
          unit: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          average_purchase_price?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_purchase_price?: number
          item_name?: string
          last_purchase_price?: number | null
          reorder_point?: number | null
          selling_price?: number
          stock_quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "InventoryItems_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      StockTransactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          purchase_price: number | null
          quantity_change: number
          reason: string | null
          reference_number: string | null
          selling_price: number | null
          total_price: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          purchase_price?: number | null
          quantity_change: number
          reason?: string | null
          reference_number?: string | null
          selling_price?: number | null
          total_price?: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          purchase_price?: number | null
          quantity_change?: number
          reason?: string | null
          reference_number?: string | null
          selling_price?: number | null
          total_price?: number | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "StockTransactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "InventoryItems"
            referencedColumns: ["id"]
          },
        ]
      }
      StoreSettings: {
        Row: {
          created_at: string
          id: number
          logo_url: string | null
          store_address: string | null
          store_email: string | null
          store_name: string
          store_phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          logo_url?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name: string
          store_phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          logo_url?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name?: string
          store_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_item_purchase: {
        Args: {
          p_item_id: string
          p_quantity_added: number
          p_purchase_price: number
          p_user_id: string
          p_transaction_type: Database["public"]["Enums"]["transaction_type"]
          p_reference_number?: string
          p_reason?: string
          p_transaction_date?: string
        }
        Returns: {
          average_purchase_price: number | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          initial_purchase_price: number
          item_name: string
          last_purchase_price: number | null
          reorder_point: number | null
          selling_price: number
          stock_quantity: number
          unit: string
          updated_at: string
          user_id: string | null
        }[]
      }
    }
    Enums: {
      transaction_type:
        | "purchase"
        | "return"
        | "inventory-correction-add"
        | "other-addition"
        | "sale"
        | "damaged"
        | "loss"
        | "expired"
        | "inventory-correction-remove"
        | "other-removal"
        | "initial-stock"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
