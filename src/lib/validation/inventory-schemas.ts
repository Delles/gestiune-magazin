import { z } from "zod";

// Schema for inventory items - simplified as per US-VSIM-001
export const inventoryItemSchema = z.object({
    id: z.string().uuid().optional(), // Optional for creation
    itemName: z.string().min(1, "Item name is required"),
    categoryId: z
        .string()
        .uuid("Please select a valid category")
        .nullable()
        .optional(),
    unit: z.string().min(1, "Unit is required"),
    purchasePrice: z
        .number()
        .min(0, "Purchase price must be a positive number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    sellingPrice: z
        .number()
        .min(0, "Selling price must be a positive number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    initialStock: z
        .number()
        .min(0, "Initial stock quantity must be a non-negative number")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
});

// Type for inventory item form values, derived from the schema
export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

// Schema for inventory item update (excluding initial stock changes)
export const inventoryItemUpdateSchema = inventoryItemSchema.omit({
    initialStock: true,
});

// Type for inventory item update form values
export type InventoryItemUpdateFormValues = z.infer<
    typeof inventoryItemUpdateSchema
>;

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
