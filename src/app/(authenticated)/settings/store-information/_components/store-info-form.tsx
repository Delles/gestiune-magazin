// src/app/(authenticated)/settings/store-information/_components/store-info-form.tsx
"use client"; // RULE 21: Client-side form interaction, hooks

import { zodResolver } from "@hookform/resolvers/zod"; // Using existing react-hook-form setup
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // RULE 23, 26
import { toast } from "sonner";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"; // RULE 12, 32
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
    storeInfoSchema,
    type StoreInfoFormValues,
} from "@/lib/validation/settings-schemas"; // RULE 31
import type { Database } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";

// Use the specific Row type from the generated types
type StoreSettings = Database["public"]["Tables"]["StoreSettings"]["Row"];
// Define a type for the default/fallback object
type DefaultStoreSettings = Omit<StoreSettings, "created_at" | "updated_at"> & {
    created_at: string | null;
    updated_at: string | null;
};
// --- Data Fetching ---
// Make the return type explicit and ensure the fallback matches
async function fetchStoreSettings(
    supabase: ReturnType<typeof createClient>
): Promise<StoreSettings | DefaultStoreSettings> {
    const { data, error } = await supabase
        .from("StoreSettings")
        .select("*")
        .maybeSingle(); // Expect 0 or 1 row

    if (error) {
        console.error("Error fetching store settings:", error);
        throw new Error("Could not load store settings.");
    }
    // Return default values matching the required fields of StoreSettings
    return (
        data || {
            id: 1, // Assuming default ID is 1 for the single row
            store_name: "",
            store_address: null,
            store_phone: null,
            store_email: null,
            logo_url: null,
            created_at: null, // Provide default/null for timestamp fields
            updated_at: null, // Provide default/null for timestamp fields
        }
    );
}

// --- Data Mutation ---
async function updateStoreSettings(
    supabase: ReturnType<typeof createClient>,
    values: StoreInfoFormValues & { id: number | bigint }
) {
    const settingsDataForUpsert = {
        store_name: values.storeName,
        store_address: values.storeAddress || null,
        store_phone: values.storePhone || null,
        store_email: values.storeEmail || null,
    };

    const { error } = await supabase
        .from("StoreSettings")
        .update(settingsDataForUpsert)
        .eq("id", Number(values.id))
        .select()
        .single();

    if (error) {
        console.error("Error updating store settings:", error);
        throw new Error("Failed to save store settings.");
    }
}

export function StoreInfoForm() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    // Fetch data using TanStack Query
    const {
        data: storeSettings,
        isLoading: isLoadingSettings,
        error: settingsError,
    } = useQuery<StoreSettings | DefaultStoreSettings>({
        queryKey: ["storeSettings"],
        queryFn: () => fetchStoreSettings(supabase),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Initialize form with empty defaults
    const form = useForm<StoreInfoFormValues>({
        resolver: zodResolver(storeInfoSchema),
        defaultValues: {
            storeName: "",
            storeAddress: "",
            storePhone: "",
            storeEmail: "",
        },
    });

    // Update form values when data loads
    React.useEffect(() => {
        if (storeSettings) {
            form.reset({
                storeName: storeSettings.store_name || "",
                storeAddress: storeSettings.store_address || "",
                storePhone: storeSettings.store_phone || "",
                storeEmail: storeSettings.store_email || "",
            });
        }
    }, [storeSettings, form]);

    const mutation = useMutation({
        mutationFn: (values: StoreInfoFormValues) =>
            updateStoreSettings(supabase, {
                ...values,
                id: storeSettings?.id ?? 1,
            }),
        onSuccess: () => {
            toast.success("Store information updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["storeSettings"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update settings.");
        },
    });

    const onSubmit = (values: StoreInfoFormValues) => {
        if (!storeSettings?.id) {
            toast.error("Cannot save settings: Store ID is missing.");
            return;
        }
        mutation.mutate(values);
    };

    // Loading State
    if (isLoadingSettings) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-20 w-full" />
                {/* ... more skeletons for phone, email, button */}
                <Skeleton className="h-10 w-24" />
            </div>
        );
    }

    // Error State
    if (settingsError) {
        return (
            <p className="text-destructive">
                Error loading settings: {settingsError.message}
            </p>
        );
    }

    return (
        // RULE 12, 32 - Using Shadcn Form components
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 max-w-2xl"
            >
                <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Your Store Name"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="storeAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Address</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="123 Main St, Anytown, USA 12345"
                                    className="resize-none"
                                    {...field}
                                    value={field.value ?? ""} // Handle null value
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="storePhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Phone</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="(123) 456-7890"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="storeEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="contact@yourstore.com"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Logo upload deferred for simplicity in Phase 1 */}
                {/*
                 <FormItem>
                     <FormLabel>Store Logo</FormLabel>
                     <FormControl>
                         <Input type="file" disabled /> // Placeholder
                     </FormControl>
                     <FormDescription>Upload your store logo (feature coming soon).</FormDescription>
                 </FormItem>
                 */}
                <Button
                    type="submit"
                    disabled={mutation.isPending || !storeSettings?.id}
                >
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </form>
        </Form>
    );
}
