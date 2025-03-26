// src/app/(authenticated)/settings/currency/_components/currency-settings-form.tsx
"use client"; // RULE 21: Client-side form interaction, hooks

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React from "react"; // Add React import for useEffect
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
} from "@/components/ui/select"; // RULE 12
import { createClient } from "@/lib/supabase/client";
import {
    currencySchema,
    type CurrencyFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";
import { SUPPORTED_CURRENCIES } from "@/lib/constants/currencies";
import { Skeleton } from "@/components/ui/skeleton";

type CurrencySettings = Database["public"]["Tables"]["CurrencySettings"]["Row"];
// Define a type for the default/fallback object
type DefaultCurrencySettings = Omit<
    CurrencySettings,
    "created_at" | "updated_at"
> & { created_at: string | null; updated_at: string | null };

// --- Data Fetching ---
async function fetchCurrencySettings(
    supabase: ReturnType<typeof createClient>
): Promise<CurrencySettings | DefaultCurrencySettings> {
    const { data, error } = await supabase
        .from("CurrencySettings")
        .select("*")
        .maybeSingle();

    if (error) {
        console.error("Error fetching currency settings:", error);
        throw new Error("Could not load currency settings.");
    }
    // Default includes necessary fields
    return (
        data || {
            id: 1, // Assuming default ID is 1
            currency_code: "USD",
            created_at: null,
            updated_at: null,
        }
    );
}

// --- Data Mutation ---
// Use UPDATE assuming row 1 exists
async function updateCurrencySettings(
    supabase: ReturnType<typeof createClient>,
    values: CurrencyFormValues & { id: number | bigint } // Pass ID separately
) {
    const settingsDataForUpdate = {
        currency_code: values.currencyCode,
    };

    const { error } = await supabase
        .from("CurrencySettings")
        .update(settingsDataForUpdate)
        .eq("id", Number(values.id)) // Target row 1
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

    // Adjust type assertion for useQuery
    const {
        data: currencySettings,
        isLoading,
        error,
    } = useQuery<CurrencySettings | DefaultCurrencySettings>({
        queryKey: ["currencySettings"],
        queryFn: () => fetchCurrencySettings(supabase),
    });

    // React Hook Form setup
    const form = useForm<CurrencyFormValues>({
        resolver: zodResolver(currencySchema),
        defaultValues: {
            currencyCode: "USD", // Default
        },
    });

    // Use useEffect to update form values when the query data is available
    React.useEffect(() => {
        if (currencySettings) {
            form.reset({
                currencyCode: currencySettings.currency_code || "USD",
            });
        }
    }, [currencySettings, form]);

    const mutation = useMutation({
        mutationFn: (values: CurrencyFormValues) =>
            updateCurrencySettings(supabase, {
                ...values,
                id: currencySettings?.id ?? 1,
            }), // Default to 1 if needed
        onSuccess: () => {
            toast.success("Currency settings updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["currencySettings"] });
            // Optionally: force reload or refresh relevant parts of UI
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update settings.");
        },
    });

    const onSubmit = (values: CurrencyFormValues) => {
        if (!currencySettings?.id) {
            toast.error(
                "Cannot save settings: Currency Settings ID is missing."
            );
            return;
        }
        mutation.mutate(values);
    };

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
                    disabled={mutation.isPending || !currencySettings?.id}
                >
                    {mutation.isPending ? "Saving..." : "Save Currency"}
                </Button>
            </form>
        </Form>
    );
}
