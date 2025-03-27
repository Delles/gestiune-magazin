"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    inventoryItemSchema,
    type InventoryItemFormValues,
} from "@/lib/validation/inventory-schemas";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Interface for form props
interface InventoryItemFormProps {
    itemId?: string; // If provided, we're editing an existing item
    onSuccess?: () => void; // Callback for when the form submission succeeds
}

// Function to fetch categories
async function getCategories() {
    const response = await fetch("/api/categories");
    if (!response.ok) {
        throw new Error("Failed to fetch categories");
    }
    return response.json();
}

// Function to fetch an inventory item by ID
async function getInventoryItem(id: string) {
    const response = await fetch(`/api/inventory/items/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch inventory item");
    }
    return response.json();
}

// Function to create a new inventory item
async function createInventoryItem(data: InventoryItemFormValues) {
    const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create inventory item");
    }

    return response.json();
}

// Function to update an existing inventory item
async function updateInventoryItem(id: string, data: InventoryItemFormValues) {
    const response = await fetch(`/api/inventory/items/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update inventory item");
    }

    return response.json();
}

export default function InventoryItemForm({
    itemId,
    onSuccess,
}: InventoryItemFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const isEditing = !!itemId;

    // Fetch categories for the dropdown
    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    // Fetch item data if we're editing
    const { data: itemData, isLoading: isLoadingItem } = useQuery({
        queryKey: ["inventoryItem", itemId],
        queryFn: () => getInventoryItem(itemId!),
        enabled: isEditing,
    });

    // Define default values
    const defaultValues: Partial<InventoryItemFormValues> = {
        itemName: "",
        categoryId: null,
        unit: "",
        purchasePrice: 0,
        sellingPrice: 0,
        initialStock: 0,
    };

    // Create or update mutation
    const mutation = useMutation({
        mutationFn: (values: InventoryItemFormValues) => {
            return isEditing
                ? updateInventoryItem(itemId!, values)
                : createInventoryItem(values);
        },
        onSuccess: () => {
            // Invalidate the inventory items query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            if (isEditing) {
                queryClient.invalidateQueries({
                    queryKey: ["inventoryItem", itemId],
                });
            }
            // Call the success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            setServerError(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"
            );
        },
    });

    // Initialize react-hook-form
    const form = useForm<InventoryItemFormValues>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues:
            isEditing && itemData
                ? {
                      id: itemData.id,
                      itemName: itemData.item_name,
                      categoryId: itemData.category_id,
                      unit: itemData.unit,
                      purchasePrice: itemData.purchase_price,
                      sellingPrice: itemData.selling_price,
                      initialStock: itemData.stock_quantity,
                  }
                : defaultValues,
    });

    // Handle form submission
    const onSubmit = form.handleSubmit((values) => {
        setServerError(null);
        mutation.mutate(values);
    });

    // Show loading state when fetching item data
    if (isEditing && isLoadingItem) {
        return (
            <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading item data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DialogHeader>
                <DialogTitle>
                    {isEditing
                        ? "Edit Inventory Item"
                        : "Add New Inventory Item"}
                </DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? "Update the details of this inventory item."
                        : "Fill in the details to add a new item to your inventory."}
                </DialogDescription>
            </DialogHeader>

            {serverError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                    {serverError}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="itemName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={
                                            field.value?.toString() || ""
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(
                                                (category: {
                                                    id: string;
                                                    name: string;
                                                }) => (
                                                    <SelectItem
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit of Measurement</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="e.g., Pieces, Bags, Meters"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="purchasePrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purchase Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sellingPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selling Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="initialStock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Initial Stock Quantity
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSuccess}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
    );
}
