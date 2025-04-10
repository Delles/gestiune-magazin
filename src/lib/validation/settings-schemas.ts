// src/lib/validation/settings-schemas.ts
import { z } from "zod";

// Schema for store information settings
export const storeInfoSchema = z.object({
    storeName: z.string().min(1, "Store name is required"),
    storeAddress: z.string().optional().or(z.literal("")), // Optional, allow empty string
    storePhone: z.string().optional().or(z.literal("")), // Optional, allow empty string
    // Email validation: must be a valid email or an empty string
    storeEmail: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")), // Optional, allow empty string
    // logoUrl will be handled separately if implementing upload (future enhancement)
});

// Type for store information form values, derived from the schema
export type StoreInfoFormValues = z.infer<typeof storeInfoSchema>;

// Schema for category settings
export const categorySchema = z.object({
    id: z.string().uuid().optional(), // Add optional id for updates
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional().nullable(), // Add optional description
});

// Type for category form values, derived from the schema
export type CategoryFormValues = z.infer<typeof categorySchema>;
