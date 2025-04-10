// src/lib/validation/inventory-schemas.ts
import { z } from "zod";

// Define ALL transaction types (intended for DB enum - might become outdated)
// Consider removing if DB enum directly uses the form types
export const transactionTypeEnum = z.enum([
    "purchase",
    "return", // Note: Not in current forms
    "inventory-correction-add", // Note: Form uses correction-add
    "other-addition", // Note: Not in current forms
    "sale",
    "damaged", // Note: Form uses write-off
    "loss", // Note: Form uses write-off
    "expired", // Note: Form uses write-off
    "inventory-correction-remove", // Note: Form uses correction-remove
    "other-removal", // Note: Not in current forms
    "initial-stock",
]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Define transaction types originating DIRECTLY from the stock adjustment forms
export const stockAdjustmentFormTransactionTypeEnum = z.enum([
    "purchase",
    "correction-add",
    "sale",
    "write-off",
    "correction-remove",
]);
export type StockAdjustmentFormTransactionType = z.infer<
    typeof stockAdjustmentFormTransactionTypeEnum
>;

// Define transaction types VALID for the backend stock adjustment API endpoint
// This should now mirror the form types exactly.
export const stockAdjustmentTransactionTypeEnum =
    stockAdjustmentFormTransactionTypeEnum;
export type StockAdjustmentTransactionType = StockAdjustmentFormTransactionType;

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

// NEW: Schema for increase stock form (Uses the unified form enum)
export const increaseStockSchema = z
    .object({
        quantity: z
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero"),
        transactionType: stockAdjustmentFormTransactionTypeEnum, // Use unified enum
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
        date: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
        // Refinement logic specific to increase types (purchase, correction-add)
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

        if (
            data.transactionType === "correction-add" &&
            (!data.reason || data.reason.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reason is required for inventory corrections (add)",
                path: ["reason"],
            });
        }
    });

// NEW: Schema for decrease stock form (Uses the unified form enum)
export const decreaseStockSchema = z
    .object({
        quantity: z
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero"),
        transactionType: stockAdjustmentFormTransactionTypeEnum, // Use unified enum
        sellingPrice: z
            .number()
            .min(0, "Selling price must be non-negative")
            .or(
                z
                    .string()
                    .regex(/^\d*\.?\d*$/)
                    .transform(Number)
            )
            .optional() // Price might not apply to correction-remove
            .nullable(),
        itemCost: z // Specific to write-off
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
        totalValue: z // Calculated total (sale revenue or write-off cost)
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
        date: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
        // Refinement logic specific to decrease types (sale, write-off, correction-remove)
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

        if (
            data.transactionType === "correction-remove" &&
            (!data.reason || data.reason.trim() === "")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Reason is required for inventory corrections (remove)",
                path: ["reason"],
            });
        }
    });

// Schema for the backend API stock adjustment endpoint
// Uses the exact same transaction types as the forms now.
export const stockAdjustmentSchema = z
    .object({
        transactionType: stockAdjustmentFormTransactionTypeEnum, // Use unified enum
        quantity: z // Quantity is required for all adjustments
            .number({
                invalid_type_error: "Quantity must be a number",
            })
            .min(0.01, "Quantity must be greater than zero")
            .or(
                z
                    .string()
                    .regex(
                        /^(?!0\.0*$)\d*\.?\d+$/,
                        "Quantity must be a positive number"
                    )
                    .transform(Number)
                    .refine((n) => n > 0, {
                        message: "Quantity must be greater than zero",
                    })
            ),
        // Price fields are optional at this top level, refined below
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
        totalPrice: z // Generic total price/value
            .number()
            .min(0, "Total price/value must be non-negative")
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
        date: z.coerce.date().optional(),
    })
    .superRefine((data, ctx) => {
        const {
            transactionType,
            reason,
            purchasePrice,
            sellingPrice,
            totalPrice,
        } = data;

        // Reason required for corrections and write-offs
        const reasonRequiredTypes: StockAdjustmentFormTransactionType[] = [
            "correction-add",
            "write-off",
            "correction-remove",
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

        // Price validation for specific types
        if (transactionType === "purchase") {
            if (
                purchasePrice === null ||
                purchasePrice === undefined ||
                purchasePrice < 0
            ) {
                // Check totalPrice as alternative only if purchasePrice is missing/invalid
                if (
                    totalPrice === null ||
                    totalPrice === undefined ||
                    totalPrice < 0
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Valid Purchase Price (or Total Price) is required for 'purchase' transactions.",
                        path: ["purchasePrice"],
                    });
                }
            }
        }
        // Note: Removed 'return' check as it's not in form types

        if (transactionType === "sale") {
            if (
                sellingPrice === null ||
                sellingPrice === undefined ||
                sellingPrice < 0
            ) {
                // Check totalPrice as alternative
                if (
                    totalPrice === null ||
                    totalPrice === undefined ||
                    totalPrice < 0
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Valid Selling Price (or Total Price) is required for 'sale' transactions.",
                        path: ["sellingPrice"],
                    });
                }
            }
        }

        if (transactionType === "write-off") {
            // For write-off, expect purchasePrice (as item cost) or totalPrice
            if (
                purchasePrice === null ||
                purchasePrice === undefined ||
                purchasePrice < 0
            ) {
                if (
                    totalPrice === null ||
                    totalPrice === undefined ||
                    totalPrice < 0
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Valid Item Cost (as Purchase Price or Total Price) is required for 'write-off' transactions.",
                        path: ["purchasePrice"],
                    });
                }
            }
        }
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
export type IncreaseStockFormValues = z.infer<typeof increaseStockSchema>;
export type DecreaseStockFormValues = z.infer<typeof decreaseStockSchema>;
