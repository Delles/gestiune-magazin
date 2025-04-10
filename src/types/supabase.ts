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
      adjust_stock: {
        Args: {
          p_item_id: string
          p_quantity_change: number
          p_transaction_type: Database["public"]["Enums"]["transaction_type"]
          p_user_id: string
          p_transaction_date?: string
          p_reason?: string
          p_reference_number?: string
          p_purchase_price?: number
          p_selling_price?: number
          p_total_price?: number
        }
        Returns: {
          id: string
          item_name: string
          category_id: string
          unit: string
          initial_purchase_price: number
          selling_price: number
          stock_quantity: number
          reorder_point: number
          description: string
          created_at: string
          updated_at: string
          last_purchase_price: number
          average_purchase_price: number
          user_id: string
        }[]
      }
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
        | "write-off"
        | "correction-add"
        | "correction-remove"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      transaction_type: [
        "purchase",
        "return",
        "inventory-correction-add",
        "other-addition",
        "sale",
        "damaged",
        "loss",
        "expired",
        "inventory-correction-remove",
        "other-removal",
        "initial-stock",
        "write-off",
        "correction-add",
        "correction-remove",
      ],
    },
  },
} as const
