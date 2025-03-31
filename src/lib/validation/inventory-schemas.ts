import { z } from "zod";

// Base schema for core editable properties
const baseItemEditableSchema = z.object({
    itemName: z
        .string()
        .min(1, "Item name is required")
        .max(100, "Item name cannot exceed 100 characters"),
    categoryId: z
        .string()
        .uuid("Please select a valid category")
        .nullable()
        .optional(),
    sellingPrice: z
        .number({ invalid_type_error: "Selling price must be a number" })
        .min(0, "Selling price must be positive or zero")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    purchasePrice: z
        .number({ invalid_type_error: "Purchase price must be a number" })
        .min(0, "Purchase price must be positive or zero")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    // Additional fields that exist in DB schema
    reorder_point: z
        .number()
        .min(0)
        .int("Reorder point must be a whole number")
        .nullable()
        .optional()
        .or(
            z
                .string()
                .regex(/^\d*$/)
                .transform((v) => (v === "" ? null : Number(v)))
        ), // Allow empty string -> null
    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .nullable()
        .optional(),
    // Remove barcode and sku as they don't exist in the DB schema
});

// Schema for CREATING an item (includes initial stock and unit)
export const inventoryItemCreateSchema = baseItemEditableSchema.extend({
    unit: z.string().min(1, "Unit is required"),
    initialStock: z
        .number({ invalid_type_error: "Initial stock must be a number" })
        .int("Initial stock must be a whole number")
        .min(0, "Initial stock quantity must be a non-negative number")
        .or(
            z
                .string()
                .regex(/^\d+$/) // Ensure it's an integer string
                .transform(Number)
        ),
});

// Schema for UPDATING an item (excludes initial stock and unit)
export const inventoryItemUpdateSchema = baseItemEditableSchema.extend({
    id: z.string().uuid(), // ID is required for update
    // Unit is intentionally excluded
});

// For backward compatibility (until all code is refactored)
export const inventoryItemSchema = inventoryItemCreateSchema.extend({
    id: z.string().uuid().optional(), // Optional for creation
});

// Type for inventory item form values, derived from the schema
export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

// Type for inventory item create form values
export type InventoryItemCreateFormValues = z.infer<
    typeof inventoryItemCreateSchema
>;

// Type for inventory item update form values
export type InventoryItemUpdateFormValues = z.infer<
    typeof inventoryItemUpdateSchema
>;

// Combined type for the form component (can receive data for create or update)
export type CombinedInventoryItemFormValues = z.infer<
    typeof inventoryItemCreateSchema
> & {
    id?: string;
}; // Add optional id

// Define the transaction types for stock adjustment
export const transactionTypeEnum = z.enum([
    // Increase types
    "purchase", // Normal purchase/receive with purchase price
    "return", // Return from customer
    "inventory-correction-add", // Correction that adds inventory
    "other-addition", // Other reasons to add inventory

    // Decrease types
    "sale", // Manual sale
    "damaged", // Damaged goods
    "loss", // Lost inventory
    "expired", // Expired products
    "inventory-correction-remove", // Correction that removes inventory
    "other-removal", // Other reasons to remove inventory
]);

export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Schema for stock adjustment (used for increasing/decreasing stock)
export const stockAdjustmentSchema = z.object({
    type: z.enum(["increase", "decrease"]),
    transactionType: transactionTypeEnum,
    quantity: z
        .number()
        .min(0.01, "Quantity must be greater than zero")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    purchasePrice: z
        .number()
        .min(0, "Purchase price must be a non-negative number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    sellingPrice: z
        .number()
        .min(0, "Selling price must be a non-negative number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    totalPrice: z
        .number()
        .min(0, "Total price must be a non-negative number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    referenceNumber: z.string().optional().nullable(),
    reason: z.string().optional().nullable(),
    date: z
        .union([
            z.date(),
            z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
                .transform((str) => new Date(str)),
        ])
        .optional()
        .default(() => new Date()),
});

// Type for stock adjustment form values
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;
