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
import {
    currencySchema,
    type CurrencyFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";
import { SUPPORTED_CURRENCIES } from "@/lib/constants/currencies";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getCurrencySettings,
    saveCurrencySettings,
} from "@/app/(authenticated)/settings/_data/api";

type CurrencySettings = Database["public"]["Tables"]["CurrencySettings"]["Row"];

export function CurrencySettingsForm() {
    const queryClient = useQueryClient();

    const {
        data: currencySettings,
        isLoading,
        error,
    } = useQuery<CurrencySettings | null, Error>({
        queryKey: ["currencySettings"],
        queryFn: getCurrencySettings,
    });

    const form = useForm<CurrencyFormValues>({
        resolver: zodResolver(currencySchema),
        defaultValues: {
            currencyCode: "USD",
        },
    });

    React.useEffect(() => {
        if (currencySettings) {
            form.reset({
                currencyCode: currencySettings.currency_code || "USD",
            });
        } else {
            form.reset({ currencyCode: "USD" });
        }
    }, [currencySettings, form]);

    const mutation = useMutation<CurrencySettings, Error, CurrencyFormValues>({
        mutationFn: saveCurrencySettings,
        onSuccess: (data) => {
            toast.success("Currency settings saved successfully!");
            queryClient.invalidateQueries({ queryKey: ["currencySettings"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save settings.");
        },
    });

    const onSubmit = (values: CurrencyFormValues) => {
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
                                value={field.value}
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
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Currency"}
                </Button>
            </form>
        </Form>
    );
}
