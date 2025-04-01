// src/lib/validation/inventory-schemas.ts
import { z } from "zod";

// Define the transaction types including 'initial-stock'
export const transactionTypeEnum = z.enum([
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
    "initial-stock", // Ensure this is included
]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Base schema for properties editable via the Edit Item form
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
    sellingPrice: z // Keep selling price editable
        .number({ invalid_type_error: "Selling price must be a number" })
        .min(0, "Selling price must be positive or zero")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        ),
    // Purchase Price is NOT directly editable here anymore
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
        ),
    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .nullable()
        .optional(),
});

// Schema for CREATING an item (Add Item Form)
export const inventoryItemCreateSchema = baseItemEditableSchema
    .extend({
        unit: z.string().min(1, "Unit is required"),
        initialStock: z
            .number({ invalid_type_error: "Initial stock must be a number" })
            .int("Initial stock must be a whole number")
            .min(0, "Initial stock quantity must be non-negative")
            .default(0)
            .or(
                z
                    .string()
                    .regex(/^\d+$/) // Ensure it's an integer string
                    .transform(Number)
            ),
        initialPurchasePrice: z // Required only if initialStock > 0
            .number({
                invalid_type_error: "Initial price must be a number",
            })
            .min(0, "Initial purchase price must be non-negative")
            .optional()
            .nullable()
            .or(
                z
                    .string()
                    .regex(/^\d*\.?\d*$/)
                    .transform((v) => (v === "" ? null : Number(v)))
            ),
    })
    .refine(
        (data) => {
            // If initialStock > 0, then initialPurchasePrice must be provided and >= 0
            if (data.initialStock > 0) {
                return (
                    data.initialPurchasePrice !== null &&
                    data.initialPurchasePrice !== undefined && // Check explicitly for undefined
                    data.initialPurchasePrice >= 0
                );
            }
            return true; // If initialStock is 0, price is not required
        },
        {
            message:
                "Initial Purchase Price is required when Initial Stock is greater than 0",
            path: ["initialPurchasePrice"],
        }
    );

// Schema for UPDATING an item (Edit Item Form)
export const inventoryItemUpdateSchema = baseItemEditableSchema.extend({
    id: z.string().uuid(), // ID is required for update
    // Unit is intentionally excluded
    // Purchase Price is intentionally excluded
});

// Schema for stock adjustment form (used by StockAdjustmentForm component)
export const stockAdjustmentSchema = z.object({
    type: z.enum(["increase", "decrease"]), // Internal UI state, might not be sent directly if using RPC for purchases
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
    purchasePrice: z // Needed for 'purchase'/'return' type adjustments
        .number()
        .min(0, "Purchase price must be non-negative")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    sellingPrice: z // Needed for 'sale'/'damaged' etc. value tracking
        .number()
        .min(0, "Selling price must be non-negative")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    totalPrice: z // Can be calculated or entered
        .number()
        .min(0, "Total price must be non-negative")
        .or(
            z
                .string()
                .regex(/^\d*\.?\d*$/)
                .transform(Number)
        )
        .optional()
        .nullable(),
    referenceNumber: z
        .string()
        .max(50, "Reference cannot exceed 50 chars")
        .optional()
        .nullable(),
    reason: z
        .string()
        .max(255, "Reason cannot exceed 255 chars")
        .optional()
        .nullable(),
    date: z
        .union([
            // Accept Date object or ISO string
            z.date(),
            z.string().datetime({ offset: true }), // Expect ISO 8601 format
        ])
        .optional()
        .default(() => new Date()), // Default to now if not provided
});

// Export types derived from schemas
export type InventoryItemCreateFormValues = z.infer<
    typeof inventoryItemCreateSchema
>;
export type InventoryItemUpdateFormValues = z.infer<
    typeof inventoryItemUpdateSchema
>;
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;
