// src/app/(authenticated)/settings/categories/_components/category-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    categorySchema,
    type CategoryFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryFormProps {
    initialData?: Category | null;
    onSubmit: (values: CategoryFormValues) => Promise<void>; // Make submit handler async
    isPending: boolean;
}

export function CategoryForm({
    initialData,
    onSubmit,
    isPending,
}: CategoryFormProps) {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            id: initialData?.id ?? undefined,
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
        },
    });

    const handleFormSubmit = async (values: CategoryFormValues) => {
        await onSubmit(values); // Call the async onSubmit prop
        // Optionally reset form after successful submission if needed (handled by parent)
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-4"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Electronics, Clothing"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe the category"
                                    className="resize-none"
                                    {...field}
                                    value={field.value ?? ""} // Handle null
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending
                        ? initialData
                            ? "Saving..."
                            : "Creating..."
                        : initialData
                        ? "Save Changes"
                        : "Create Category"}
                </Button>
            </form>
        </Form>
    );
}
