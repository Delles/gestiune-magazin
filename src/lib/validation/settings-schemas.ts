// src/lib/validation/settings-schemas.ts
import { z } from "zod";

// Schema for store information settings
export const storeInfoSchema = z.object({
    storeName: z.string().min(1, "Store name is required"),
    storeAddress: z.string().optional(),
    storePhone: z.string().optional(),
    // Email validation: must be a valid email or an empty string
    storeEmail: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")), // Allows empty string as a valid value
    // logoUrl will be handled separately if implementing upload (future enhancement)
});

// Type for store information form values, derived from the schema
export type StoreInfoFormValues = z.infer<typeof storeInfoSchema>;

// Schema for currency settings
export const currencySchema = z.object({
    currencyCode: z.string().min(3, "Currency code is required"), // e.g., USD, EUR
});

// Type for currency form values, derived from the schema
export type CurrencyFormValues = z.infer<typeof currencySchema>;

// Schema for category settings
export const categorySchema = z.object({
    id: z.string().uuid().optional(), // Optional for creation
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional().nullable(),
});

// Type for category form values, derived from the schema
export type CategoryFormValues = z.infer<typeof categorySchema>;
