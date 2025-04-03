"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";

// Schema for reorder point - allows null or positive number
const reorderPointSchema = z.object({
    reorder_point: z.preprocess(
        (val) => (val === "" ? null : Number(val)), // Convert empty string to null, otherwise try number
        z.number().positive("Must be a positive number").nullable()
    ),
});

type ReorderPointFormValues = z.infer<typeof reorderPointSchema>;

interface AdjustReorderPointPopoverContentProps {
    initialValue: number | null;
    unit: string;
    onSave: (data: ReorderPointFormValues) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export default function AdjustReorderPointPopoverContent({
    initialValue,
    unit,
    onSave,
    onCancel,
    isLoading,
}: AdjustReorderPointPopoverContentProps) {
    const form = useForm<ReorderPointFormValues>({
        resolver: zodResolver(reorderPointSchema),
        defaultValues: {
            reorder_point: initialValue,
        },
    });

    const onSubmit = (data: ReorderPointFormValues) => {
        onSave(data);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-4 space-y-4"
            >
                <FormField
                    control={form.control}
                    name="reorder_point"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reorder Point ({unit}s)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter level (or leave blank)"
                                    {...field}
                                    // Ensure value is string or number for Input
                                    value={field.value ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        // Allow empty string for null, otherwise parse as number
                                        field.onChange(
                                            value === "" ? null : Number(value)
                                        );
                                    }}
                                    min="0"
                                    step="1"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !form.formState.isDirty}
                    >
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    );
}
