// src/app/(authenticated)/inventory/_components/edit-item-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    inventoryItemUpdateSchema,
    type InventoryItemUpdateFormValues,
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
import { Loader2, DollarSign, Package, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tables } from "@/types/supabase"; // Use Supabase types
import {
    getCategories,
    getInventoryItem,
    updateInventoryItem,
} from "../../_data/api"; // Import API functions
import { cn } from "@/lib/utils";

interface EditItemFormProps {
    itemId: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function EditItemForm({
    itemId,
    onSuccess,
    onClose,
}: EditItemFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch categories
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
        Tables<"categories">[] // Use Supabase type
    >({
        queryKey: ["categories"],
        queryFn: getCategories, // Use imported function
    });

    // Fetch item data for editing
    const {
        data: itemData,
        isLoading: isLoadingItem,
        error: itemError,
    } = useQuery<Tables<"InventoryItems">>({
        queryKey: ["inventoryItem", itemId],
        queryFn: () => getInventoryItem(itemId), // Use imported function
        enabled: !!itemId,
    });

    const form = useForm<InventoryItemUpdateFormValues>({
        resolver: zodResolver(inventoryItemUpdateSchema),
        defaultValues: {
            id: itemId,
            itemName: "",
            categoryId: null,
            sellingPrice: undefined,
            reorder_point: null,
            description: "",
        },
        mode: "onChange",
    });

    // Populate form once item data is loaded
    useEffect(() => {
        if (itemData) {
            form.reset({
                id: itemData.id,
                itemName: itemData.item_name || "",
                categoryId: itemData.category_id ?? null,
                sellingPrice: itemData.selling_price ?? undefined,
                reorder_point: itemData.reorder_point ?? null,
                description: itemData.description || "",
            });
        }
    }, [itemData, form]);

    const mutation = useMutation({
        mutationFn: (values: InventoryItemUpdateFormValues) =>
            updateInventoryItem(itemId, values), // Use imported function
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] }); // Invalidate list
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            }); // Invalidate specific item
            queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
            toast.success(data.message || "Item updated successfully!");
            onSuccess?.();
        },
        onError: (error) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            // Check for specific errors
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

    const onSubmit = (values: InventoryItemUpdateFormValues) => {
        setServerError(null);
        // Clean data before sending (e.g., ensure categoryId is null if 'null' string selected)
        const dataToSend = {
            ...values,
            categoryId: values.categoryId === "null" ? null : values.categoryId,
        };
        mutation.mutate(dataToSend);
    };

    const isLoading = isLoadingItem || isLoadingCategories;

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    if (itemError) {
        return (
            <p className="p-4 text-destructive">
                Error loading item data: {itemError.message}
            </p>
        );
    }
    if (!itemData) {
        return <p className="p-4 text-muted-foreground">Item not found.</p>; // Should ideally be handled by parent page
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 px-1 py-2"
            >
                {serverError && (
                    <div className="bg-destructive/10 p-3 rounded-md border border-destructive text-sm text-destructive">
                        {serverError}
                    </div>
                )}

                {/* Read-only Unit */}
                <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                        <Input
                            readOnly
                            value={itemData.unit}
                            className="bg-muted/50 cursor-not-allowed border-dashed"
                        />
                    </FormControl>
                    <FormDescription className="text-xs italic">
                        Unit cannot be changed after creation.
                    </FormDescription>
                </FormItem>

                {/* Item Name */}
                <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Organic Tomatoes"
                                        className="pl-9 shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                        {...field}
                                    />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category */}
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category (Optional)</FormLabel>
                            <Select
                                onValueChange={(value) =>
                                    field.onChange(
                                        value === "null" ? null : value
                                    )
                                }
                                value={field.value ?? "null"}
                            >
                                <FormControl>
                                    <SelectTrigger className="shadow-soft-inner bg-input border border-border focus:ring-primary/80 focus:ring-offset-0 focus:ring-2">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="border border-black/5 dark:border-white/10 bg-gradient-to-b from-popover to-popover/95 dark:from-popover dark:to-popover/90 shadow-md">
                                    <SelectItem value="null">
                                        -- No Category --
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Unit price for selling this item.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Selling Price */}
                <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Selling Price</FormLabel>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-9 shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
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
                            </div>
                            <FormDescription>
                                Unit price for selling this item.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Reorder Point */}
                <FormField
                    control={form.control}
                    name="reorder_point"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reorder Point (Optional)</FormLabel>
                            <div className="relative">
                                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="e.g., 10"
                                        className="pl-9 shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value)
                                            )
                                        }
                                    />
                                </FormControl>
                            </div>
                            <FormDescription>
                                Low stock warning level.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter item description (optional)"
                                    rows={4}
                                    className="resize-none shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                            "border border-black/10 dark:border-white/15",
                            "hover:bg-accent/50 active:bg-accent/70",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "transition-all duration-150 ease-in-out"
                        )}
                        onClick={onClose}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className={cn(
                            "shadow-soft-md hover:shadow-soft-lg active:shadow-soft-inner",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "transition-all duration-150 ease-in-out",
                            "active:bg-primary/90"
                        )}
                        disabled={mutation.isPending || !form.formState.isValid}
                    >
                        {mutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
