// src/lib/validation/inventory-schemas.ts
import { z } from "zod";

// Define ALL transaction types (including initial-stock for logging etc.)
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
    "initial-stock", // Kept here for a complete list if needed elsewhere
]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Define transaction types VALID for stock adjustments (excludes initial-stock)
export const stockAdjustmentTransactionTypeEnum = z.enum([
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
]);
export type StockAdjustmentTransactionType = z.infer<
    typeof stockAdjustmentTransactionTypeEnum
>;

// NEW: Define simplified transaction types for increase stock
export const increaseStockTransactionTypeEnum = z.enum([
    "purchase",
    "correction-add", // Simplified from inventory-correction-add
]);
export type IncreaseStockTransactionType = z.infer<
    typeof increaseStockTransactionTypeEnum
>;

// NEW: Define simplified transaction types for decrease stock
export const decreaseStockTransactionTypeEnum = z.enum([
    "sale",
    "write-off", // Combines damaged, loss, expired into one
    "correction-remove", // Simplified from inventory-correction-remove
]);
export type DecreaseStockTransactionType = z.infer<
    typeof decreaseStockTransactionTypeEnum
>;

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

// Schema for updating just the reorder point
export const inventoryItemReorderPointUpdateSchema = z.object({
    reorder_point: z
        .number()
        .min(0)
        .int("Reorder point must be a whole number")
        .nullable()
        .or(
            z
                .string()
                .regex(/^\d*$/)
                .transform((v) => (v === "" ? null : Number(v)))
        ),
});

// NEW: Schema for increase stock form
export const increaseStockSchema = z
    .object({
        quantity: z
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero"),
        transactionType: increaseStockTransactionTypeEnum,
        purchasePrice: z
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
        totalCost: z
            .number()
            .min(0, "Total cost must be non-negative")
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
            .union([z.date(), z.string().datetime({ offset: true })])
            .optional()
            .default(() => new Date()),
    })
    .superRefine((data, ctx) => {
        // If transaction type is purchase, either purchasePrice OR totalCost should be provided
        if (data.transactionType === "purchase" && data.quantity > 0) {
            const hasPurchasePrice =
                data.purchasePrice !== null && data.purchasePrice !== undefined;
            const hasTotalCost =
                data.totalCost !== null && data.totalCost !== undefined;

            if (!hasPurchasePrice && !hasTotalCost) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Either purchase price or total cost should be provided for purchases",
                    path: ["purchasePrice"],
                });
            }
        }

        // If transaction type is correction-add, reason is required
        if (
            data.transactionType === "correction-add" &&
            (!data.reason || data.reason.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reason is required for inventory corrections",
                path: ["reason"],
            });
        }
    });

// NEW: Schema for decrease stock form
export const decreaseStockSchema = z
    .object({
        quantity: z
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero"),
        transactionType: decreaseStockTransactionTypeEnum,
        sellingPrice: z
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
        itemCost: z
            .number()
            .min(0, "Item cost must be non-negative")
            .or(
                z
                    .string()
                    .regex(/^\d*\.?\d*$/)
                    .transform(Number)
            )
            .optional()
            .nullable(),
        totalValue: z
            .number()
            .min(0, "Total value must be non-negative")
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
            .union([z.date(), z.string().datetime({ offset: true })])
            .optional()
            .default(() => new Date()),
    })
    .superRefine((data, ctx) => {
        // For sale, either sellingPrice OR totalValue should be provided
        if (data.transactionType === "sale" && data.quantity > 0) {
            const hasSellingPrice =
                data.sellingPrice !== null && data.sellingPrice !== undefined;
            const hasTotalValue =
                data.totalValue !== null && data.totalValue !== undefined;

            if (!hasSellingPrice && !hasTotalValue) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Either selling price or total value should be provided for sales",
                    path: ["sellingPrice"],
                });
            }
        }

        // For write-offs, either itemCost OR totalValue should be provided, and reason is required
        if (data.transactionType === "write-off") {
            const hasItemCost =
                data.itemCost !== null && data.itemCost !== undefined;
            const hasTotalValue =
                data.totalValue !== null && data.totalValue !== undefined;

            if (!hasItemCost && !hasTotalValue) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Either item cost or total value should be provided for write-offs",
                    path: ["itemCost"],
                });
            }

            if (!data.reason || data.reason.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Reason is required for write-offs",
                    path: ["reason"],
                });
            }
        }

        // For correction-remove, reason is required
        if (
            data.transactionType === "correction-remove" &&
            (!data.reason || data.reason.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reason is required for inventory corrections",
                path: ["reason"],
            });
        }
    });

// Schema for stock adjustment form (used by StockAdjustmentForm component)
export const stockAdjustmentSchema = z
    .object({
        transactionType: stockAdjustmentTransactionTypeEnum, // Use the specific enum for adjustments
        quantity: z
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero")
            .or(
                z
                    .string()
                    // Ensure the string represents a positive number (integer or decimal)
                    .regex(
                        /^(?!0\.?0*$)\d*\.?\d+$/,
                        "Quantity must be a positive number"
                    )
                    .transform(Number)
                    .refine((n) => n > 0, {
                        message: "Quantity must be greater than zero",
                    })
            )
            .optional(),
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
    })
    .superRefine((data, ctx) => {
        const { transactionType, reason } = data;

        const reasonRequiredTypes: StockAdjustmentTransactionType[] = [
            "inventory-correction-add",
            "other-addition",
            "damaged",
            "loss",
            "expired",
            "inventory-correction-remove",
            "other-removal",
        ];

        if (
            reasonRequiredTypes.includes(transactionType) &&
            (!reason || reason.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reason/Notes are required for this transaction type.",
                path: ["reason"],
            });
        }

        // Could add price field validation refinements here too if needed
        // e.g., ensure purchasePrice exists for 'purchase'
    });

// Export types derived from schemas
export type InventoryItemCreateFormValues = z.infer<
    typeof inventoryItemCreateSchema
>;
export type InventoryItemUpdateFormValues = z.infer<
    typeof inventoryItemUpdateSchema
>;
export type InventoryItemReorderPointUpdateFormValues = z.infer<
    typeof inventoryItemReorderPointUpdateSchema
>;
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

// NEW: Export types for increase and decrease stock forms
export type IncreaseStockFormValues = z.infer<typeof increaseStockSchema>;
export type DecreaseStockFormValues = z.infer<typeof decreaseStockSchema>;
