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
// Removed direct client import: import { createClient } from "@/lib/supabase/client";
import {
    storeInfoSchema,
    type StoreInfoFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";
import { Skeleton } from "@/components/ui/skeleton";
// Import API helper functions
import {
    getStoreSettings,
    saveStoreSettings,
} from "@/app/(authenticated)/settings/_data/api";

type StoreSettings = Database["public"]["Tables"]["StoreSettings"]["Row"];

// --- Removed local data fetching/mutation functions ---

export function StoreInfoForm() {
    const queryClient = useQueryClient();
    // Removed: const supabase = createClient();

    // Query uses the API helper, expects StoreSettings or null
    const {
        data: storeSettings,
        isLoading: isLoadingSettings,
        error: settingsError,
    } = useQuery<StoreSettings | null, Error>({
        // Explicitly type Error
        queryKey: ["storeSettings"],
        queryFn: getStoreSettings,
        staleTime: 5 * 60 * 1000, // Keep existing cache settings
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

    React.useEffect(() => {
        if (storeSettings) {
            form.reset({
                storeName: storeSettings.store_name || "",
                storeAddress: storeSettings.store_address || "",
                storePhone: storeSettings.store_phone || "",
                storeEmail: storeSettings.store_email || "",
            });
        } else {
            form.reset({
                storeName: "",
                storeAddress: "",
                storePhone: "",
                storeEmail: "",
            });
        }
    }, [storeSettings, form]);

    // Mutation now uses the single save helper
    const mutation = useMutation<StoreSettings, Error, StoreInfoFormValues>({
        mutationFn: saveStoreSettings, // Use the API helper which handles upsert
        onSuccess: (data) => {
            toast.success("Store information saved successfully!");
            // Update the query cache directly with the fresh data
            queryClient.setQueryData(["storeSettings"], data);
            // Invalidation might still be useful if other queries depend on this,
            // but setQueryData provides the immediate update.
            // queryClient.invalidateQueries({ queryKey: ["storeSettings"] });
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
                                    placeholder="+1 (555) 123-4567"
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
                    name="storeEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="contact@yourstore.com"
                                    {...field}
                                    value={field.value ?? ""} // Handle null value
                                />
                            </FormControl>
                            <FormDescription>
                                This email can be used for customer inquiries.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Information"}
                </Button>
            </form>
        </Form>
    );
}
