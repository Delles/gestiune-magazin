// src/app/(authenticated)/inventory/_components/add-item-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    inventoryItemCreateSchema,
    type InventoryItemCreateFormValues,
} from "@/lib/validation/inventory-schemas";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    DollarSign,
    Package,
    Info,
    AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Category } from "../../types/types"; // Import type
import { getCategories, createInventoryItem } from "../../_data/api"; // Import API functions

interface AddItemFormProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function AddItemForm({ onSuccess, onClose }: AddItemFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
        Category[]
    >({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    const form = useForm<InventoryItemCreateFormValues>({
        resolver: zodResolver(inventoryItemCreateSchema),
        defaultValues: {
            itemName: "",
            categoryId: null, // Default to null
            unit: "",
            sellingPrice: undefined,
            initialStock: 0,
            initialPurchasePrice: null, // Default to null
            reorder_point: null,
            description: "",
        },
        mode: "onChange",
    });

    const initialStockValue = form.watch("initialStock"); // Watch initial stock

    const mutation = useMutation({
        mutationFn: createInventoryItem,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
            // Assuming API returns { message: string, item: object }
            toast.success(data.message || "Item added successfully!");
            onSuccess?.(); // Close dialog/sheet
        },
        onError: (error) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            // Check for specific errors if API provides them
            if (errorMessage.includes("Conflict")) {
                form.setError("itemName", {
                    type: "manual",
                    message: "This item name already exists.",
                });
                setServerError(null);
            } else if (errorMessage.includes("Category not found")) {
                form.setError("categoryId", {
                    type: "manual",
                    message: "Selected category not found.",
                });
                setServerError(null);
            } else {
                setServerError(errorMessage);
                toast.error(`Error: ${errorMessage}`);
            }
        },
    });

    const onSubmit = (values: InventoryItemCreateFormValues) => {
        setServerError(null);
        // Ensure purchase price is null if stock is 0
        const dataToSend = {
            ...values,
            initialPurchasePrice:
                values.initialStock > 0 ? values.initialPurchasePrice : null,
        };
        mutation.mutate(dataToSend);
    };

    if (isLoadingCategories) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ); // Basic loading
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 px-1 py-2"
            >
                {serverError && (
                    <div className="bg-destructive/10 p-3 rounded-md border border-destructive text-sm text-destructive">
                        {serverError}
                    </div>
                )}

                {/* Item Name */}
                <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                        <FormItem>
                            {" "}
                            <FormLabel>Item Name</FormLabel>{" "}
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Organic Tomatoes"
                                        className="pl-9"
                                        {...field}
                                    />
                                </FormControl>
                            </div>{" "}
                            <FormMessage />{" "}
                        </FormItem>
                    )}
                />

                {/* Category & Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                {" "}
                                <FormLabel>Category (Optional)</FormLabel>{" "}
                                <Select
                                    onValueChange={(value) =>
                                        field.onChange(
                                            value === "null" ? null : value
                                        )
                                    }
                                    value={field.value ?? "null"}
                                >
                                    {" "}
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>{" "}
                                    <SelectContent>
                                        {" "}
                                        <SelectItem value="null">
                                            -- No Category --
                                        </SelectItem>{" "}
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}{" "}
                                    </SelectContent>{" "}
                                </Select>{" "}
                                <FormMessage />{" "}
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                {" "}
                                <FormLabel>Unit</FormLabel>{" "}
                                <FormControl>
                                    <Input
                                        placeholder="e.g., pcs, kg, box"
                                        {...field}
                                    />
                                </FormControl>{" "}
                                <FormDescription className="text-xs">
                                    Unit of measurement.
                                </FormDescription>{" "}
                                <FormMessage />{" "}
                            </FormItem>
                        )}
                    />
                </div>

                {/* Selling Price */}
                <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                        <FormItem>
                            {" "}
                            <FormLabel>Selling Price</FormLabel>{" "}
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-9"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ""
                                                    ? undefined
                                                    : Number(e.target.value)
                                            )
                                        }
                                    />
                                </FormControl>
                            </div>{" "}
                            <FormMessage />{" "}
                        </FormItem>
                    )}
                />

                {/* Stock & Initial Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed pt-4">
                    <FormField
                        control={form.control}
                        name="initialStock"
                        render={({ field }) => (
                            <FormItem>
                                {" "}
                                <FormLabel>Initial Stock</FormLabel>{" "}
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ""
                                                    ? 0
                                                    : parseInt(
                                                          e.target.value,
                                                          10
                                                      ) || 0
                                            )
                                        }
                                    />
                                </FormControl>{" "}
                                <FormDescription className="text-xs">
                                    Quantity currently on hand.
                                </FormDescription>{" "}
                                <FormMessage />{" "}
                            </FormItem>
                        )}
                    />
                    {/* Conditionally render Initial Purchase Price */}
                    {initialStockValue > 0 && (
                        <FormField
                            control={form.control}
                            name="initialPurchasePrice"
                            render={({ field }) => (
                                <FormItem>
                                    {" "}
                                    <FormLabel>
                                        Initial Purchase Price
                                    </FormLabel>{" "}
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="0.00"
                                                className="pl-9"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? null
                                                            : Number(
                                                                  e.target.value
                                                              )
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </div>{" "}
                                    <FormDescription className="text-xs">
                                        Cost per unit for initial stock.
                                    </FormDescription>{" "}
                                    <FormMessage />{" "}
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Reorder Point & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                        control={form.control}
                        name="reorder_point"
                        render={({ field }) => (
                            <FormItem>
                                {" "}
                                <FormLabel>
                                    Reorder Point (Optional)
                                </FormLabel>{" "}
                                <div className="relative">
                                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="e.g., 10"
                                            className="pl-9"
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ""
                                                        ? null
                                                        : parseInt(
                                                              e.target.value,
                                                              10
                                                          ) || 0
                                                )
                                            }
                                        />
                                    </FormControl>
                                </div>{" "}
                                <FormDescription className="text-xs">
                                    Low stock warning level.
                                </FormDescription>{" "}
                                <FormMessage />{" "}
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            {" "}
                            <FormLabel>Description (Optional)</FormLabel>{" "}
                            <div className="relative">
                                <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Textarea
                                        placeholder="Add details..."
                                        className="min-h-[80px] pl-9"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                            </div>{" "}
                            <FormMessage />{" "}
                        </FormItem>
                    )}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={mutation.isPending}
                        className="transition-colors duration-150"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={mutation.isPending || !form.formState.isValid}
                        className="transition-colors duration-150"
                    >
                        {mutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {mutation.isPending ? "Adding Item..." : "Add Item"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
