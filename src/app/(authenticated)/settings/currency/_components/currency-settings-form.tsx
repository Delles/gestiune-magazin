// src/app/(authenticated)/settings/currency/_components/currency-settings-form.tsx
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
    currencySchema,
    type CurrencyFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";
import { SUPPORTED_CURRENCIES } from "@/lib/constants/currencies";
import { Skeleton } from "@/components/ui/skeleton";

type CurrencySettings = Database["public"]["Tables"]["CurrencySettings"]["Row"];

// --- Data Fetching ---
// Fetch function returns CurrencySettings or null
async function fetchCurrencySettings(
    supabase: ReturnType<typeof createClient>
): Promise<CurrencySettings | null> {
    const { data, error } = await supabase
        .from("CurrencySettings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching currency settings:", error);
        throw new Error("Could not load currency settings.");
    }
    return data; // Returns data or null
}

// --- Data Mutations (Separate Insert/Update) ---
async function insertCurrencySettings(
    supabase: ReturnType<typeof createClient>,
    values: CurrencyFormValues
) {
    const settingsDataToInsert = {
        currency_code: values.currencyCode,
        // No ID provided!
    };
    const { error } = await supabase
        .from("CurrencySettings")
        .insert(settingsDataToInsert)
        .select()
        .single();

    if (error) {
        console.error("Error inserting currency settings:", error);
        throw new Error("Failed to create currency settings.");
    }
}

async function updateCurrencySettings(
    supabase: ReturnType<typeof createClient>,
    values: CurrencyFormValues,
    id: number | bigint // Existing ID required
) {
    const settingsDataToUpdate = {
        currency_code: values.currencyCode,
        // No ID provided!
    };
    const { error } = await supabase
        .from("CurrencySettings")
        .update(settingsDataToUpdate)
        .eq("id", Number(id)) // Use existing ID
        .select()
        .single();

    if (error) {
        console.error("Error updating currency settings:", error);
        throw new Error("Failed to save currency settings.");
    }
}

export function CurrencySettingsForm() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    // Query now expects CurrencySettings or null
    const {
        data: currencySettings, // This can be CurrencySettings | null
        isLoading,
        error,
    } = useQuery<CurrencySettings | null>({
        queryKey: ["currencySettings"],
        queryFn: () => fetchCurrencySettings(supabase),
    });

    const form = useForm<CurrencyFormValues>({
        resolver: zodResolver(currencySchema),
        defaultValues: {
            currencyCode: "USD", // Default
        },
    });

    // Use useEffect to update form values
    React.useEffect(() => {
        if (currencySettings) {
            form.reset({
                currencyCode: currencySettings.currency_code || "USD",
            });
        } else {
            // Reset to default if no data (for insert case)
            form.reset({ currencyCode: "USD" });
        }
    }, [currencySettings, form]);

    const mutation = useMutation({
        mutationFn: async (values: CurrencyFormValues) => {
            // Decide whether to insert or update
            if (currencySettings?.id) {
                await updateCurrencySettings(
                    supabase,
                    values,
                    currencySettings.id
                );
            } else {
                await insertCurrencySettings(supabase, values);
            }
        },
        onSuccess: () => {
            toast.success(
                `Currency settings ${
                    currencySettings?.id ? "updated" : "saved"
                } successfully!`
            );
            queryClient.invalidateQueries({ queryKey: ["currencySettings"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update settings.");
        },
    });

    const onSubmit = (values: CurrencyFormValues) => {
        mutation.mutate(values);
    };

    // --- Loading and Error States ---
    if (isLoading) {
        return (
            <div className="space-y-4 max-w-md">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-24" />
            </div>
        );
    }
    if (error) {
        return (
            <p className="text-destructive">
                Error loading currency settings: {error.message}
            </p>
        );
    }

    // --- Form JSX ---
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 max-w-md"
            >
                <FormField
                    control={form.control}
                    name="currencyCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Store Currency</FormLabel>
                            <Select
                                key={field.value}
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value} // Ensure controlled component
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a currency" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {SUPPORTED_CURRENCIES.map((currency) => (
                                        <SelectItem
                                            key={currency.code}
                                            value={currency.code}
                                        >
                                            {currency.name} ({currency.symbol})
                                            - {currency.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select the primary currency for all financial
                                values.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={mutation.isPending} // Only disable during mutation
                >
                    {mutation.isPending ? "Saving..." : "Save Currency"}
                </Button>
            </form>
        </Form>
    );
}
