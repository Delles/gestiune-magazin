// src/app/(authenticated)/settings/store-information/_components/store-info-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
    storeInfoSchema,
    type StoreInfoFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";

type StoreSettings = Database["public"]["Tables"]["StoreSettings"]["Row"];

// --- Data Fetching ---
// Fetch function now returns StoreSettings OR null if no row exists
async function fetchStoreSettings(
    supabase: ReturnType<typeof createClient>
): Promise<StoreSettings | null> {
    // Return null if not found
    const { data, error } = await supabase
        .from("StoreSettings")
        .select("*")
        .limit(1)
        .maybeSingle(); // Returns data or null

    if (error) {
        console.error("Error fetching store settings:", error);
        throw new Error("Could not load store settings.");
    }
    return data; // Directly return data or null
}

// --- Data Mutations (Separate Insert/Update) ---
async function insertStoreSettings(
    supabase: ReturnType<typeof createClient>,
    values: StoreInfoFormValues
) {
    const settingsDataToInsert = {
        store_name: values.storeName,
        store_address: values.storeAddress || null,
        store_phone: values.storePhone || null,
        store_email: values.storeEmail || null,
        // No ID provided here!
    };
    const { error } = await supabase
        .from("StoreSettings")
        .insert(settingsDataToInsert)
        .select()
        .single();

    if (error) {
        console.error("Error inserting store settings:", error);
        throw new Error("Failed to create store settings.");
    }
}

async function updateStoreSettings(
    supabase: ReturnType<typeof createClient>,
    values: StoreInfoFormValues,
    id: number | bigint // Existing ID is required
) {
    const settingsDataToUpdate = {
        store_name: values.storeName,
        store_address: values.storeAddress || null,
        store_phone: values.storePhone || null,
        store_email: values.storeEmail || null,
        // No ID provided here!
    };

    const { error } = await supabase
        .from("StoreSettings")
        .update(settingsDataToUpdate)
        .eq("id", Number(id)) // Use the existing ID to target the row
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

    // Query now expects StoreSettings or null
    const {
        data: storeSettings, // This can be StoreSettings | null
        isLoading: isLoadingSettings,
        error: settingsError,
    } = useQuery<StoreSettings | null>({
        queryKey: ["storeSettings"],
        queryFn: () => fetchStoreSettings(supabase),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const form = useForm<StoreInfoFormValues>({
        resolver: zodResolver(storeInfoSchema),
        defaultValues: {
            storeName: "",
            storeAddress: "",
            storePhone: "",
            storeEmail: "",
        },
    });

    // Update form when data loads or changes
    React.useEffect(() => {
        // Only reset if storeSettings is not null (i.e., data exists)
        // If null, the defaults are fine (empty form for insertion)
        if (storeSettings) {
            form.reset({
                storeName: storeSettings.store_name || "",
                storeAddress: storeSettings.store_address || "",
                storePhone: storeSettings.store_phone || "",
                storeEmail: storeSettings.store_email || "",
            });
        } else {
            // Explicitly reset to defaults if data is null (ensures clean state)
            form.reset({
                storeName: "",
                storeAddress: "",
                storePhone: "",
                storeEmail: "",
            });
        }
    }, [storeSettings, form]);

    const mutation = useMutation({
        mutationFn: async (values: StoreInfoFormValues) => {
            // Decide whether to insert or update based on fetched data
            if (storeSettings?.id) {
                // Existing row found, perform update
                await updateStoreSettings(supabase, values, storeSettings.id);
            } else {
                // No existing row, perform insert
                await insertStoreSettings(supabase, values);
            }
        },
        onSuccess: () => {
            // values are the form values submitted
            toast.success(
                `Store information ${
                    storeSettings?.id ? "updated" : "created"
                } successfully!`
            );
            queryClient.invalidateQueries({ queryKey: ["storeSettings"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save settings.");
        },
    });

    const onSubmit = (values: StoreInfoFormValues) => {
        mutation.mutate(values);
    };

    // --- Loading and Error States ---
    if (isLoadingSettings) {
        return (
            <div className="space-y-4 max-w-2xl">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-24 mt-4" />
            </div>
        );
    }
    if (settingsError) {
        return (
            <p className="text-destructive">
                Error loading settings: {settingsError.message}
            </p>
        );
    }

    // --- Form JSX ---
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 max-w-2xl"
            >
                {/* Fields: storeName, storeAddress, storePhone, storeEmail */}
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
                <Button
                    type="submit"
                    disabled={mutation.isPending} // Disable only during mutation
                >
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </form>
        </Form>
    );
}
