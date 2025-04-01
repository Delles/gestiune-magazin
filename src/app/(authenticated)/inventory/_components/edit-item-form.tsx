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
import {
    Loader2,
    DollarSign,
    Package,
    Info,
    AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Category = { id: string; name: string };
// Assuming InventoryItem type includes the new price fields if needed for display defaults
type InventoryItem = {
    id: string;
    item_name: string;
    category_id: string | null;
    category_name?: string; // Added by API join potentially
    unit: string;
    initial_purchase_price: number; // Renamed from purchase_price
    selling_price: number;
    stock_quantity: number;
    reorder_point: number | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    last_purchase_price: number | null; // NEW
    average_purchase_price: number | null; // NEW
};

interface EditItemFormProps {
    itemId: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

// Function to fetch categories
async function getCategories(): Promise<Category[]> {
    /* ... same as in AddItemForm ... */
    const response = await fetch("/api/categories");
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
}

// Function to fetch an inventory item by ID
async function getInventoryItem(id: string): Promise<InventoryItem> {
    // Specify return type
    const response = await fetch(`/api/inventory/items/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error("Item not found");
        throw new Error("Failed to fetch inventory item");
    }
    return response.json();
}

// Function to update an existing inventory item
async function updateInventoryItem(
    id: string,
    data: Omit<InventoryItemUpdateFormValues, "id">
) {
    const response = await fetch(`/api/inventory/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.message || errorData.error || "Failed to update item"
        );
    }
    return response.json();
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
        Category[]
    >({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    // Fetch item data for editing
    const {
        data: itemData,
        isLoading: isLoadingItem,
        error: itemError,
    } = useQuery<InventoryItem>({
        queryKey: ["inventoryItem", itemId],
        queryFn: () => getInventoryItem(itemId),
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
            updateInventoryItem(itemId, values),
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
                className="space-y-6 px-1 py-2"
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

                {/* Category */}
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
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}{" "}
                                </SelectContent>{" "}
                            </Select>{" "}
                            <FormMessage />{" "}
                        </FormItem>
                    )}
                />

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
                <div className="flex justify-end gap-2 pt-4">
                    {onClose && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={mutation.isPending || isLoading}
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
