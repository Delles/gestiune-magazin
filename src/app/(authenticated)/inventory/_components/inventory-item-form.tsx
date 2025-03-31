"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    inventoryItemCreateSchema,
    inventoryItemUpdateSchema,
    type InventoryItemCreateFormValues,
    type InventoryItemUpdateFormValues,
    type CombinedInventoryItemFormValues,
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
import { cn } from "@/lib/utils";
import {
    Loader2,
    DollarSign,
    Package,
    Info,
    AlertTriangle,
    ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";

// Add Category type definition
type Category = { id: string; name: string };

// Interface for form props
interface InventoryItemFormProps {
    itemId?: string; // If provided, we're editing an existing item
    onSuccess?: () => void; // Callback for when the form submission succeeds
    onClose?: () => void; // Added onClose prop
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
async function createInventoryItem(data: InventoryItemCreateFormValues) {
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
async function updateInventoryItem(
    id: string,
    data: Omit<InventoryItemUpdateFormValues, "id">
) {
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
    onClose,
}: InventoryItemFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    // Track data loaded state to prevent unnecessary resets
    const [dataLoaded, setDataLoaded] = useState(false);
    // Reference to track which category ID we're currently displaying
    const [displayCategoryId, setDisplayCategoryId] = useState<string>("null");
    const queryClient = useQueryClient();
    const isEditing = !!itemId;

    // Fetch categories for the dropdown
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
        Category[]
    >({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    // Fetch item data if we're editing
    const {
        data: itemData,
        isLoading: isLoadingItem,
        error: itemError,
    } = useQuery({
        queryKey: ["inventoryItem", itemId],
        queryFn: () => getInventoryItem(itemId!),
        enabled: isEditing,
    });

    // Add debug logging for categories when they load
    useEffect(() => {
        if (categories.length > 0) {
            console.log(
                "🔍 Available Categories:",
                categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    id_type: typeof c.id,
                }))
            );
        }
    }, [categories]);

    // Choose the correct schema based on mode
    const currentSchema = isEditing
        ? inventoryItemUpdateSchema
        : inventoryItemCreateSchema;

    // Initialize react-hook-form with a proper type for the resolver
    const form = useForm<CombinedInventoryItemFormValues>({
        resolver: zodResolver(
            currentSchema as unknown as z.ZodType<CombinedInventoryItemFormValues>
        ),
        defaultValues: {
            id: itemId, // Important for update schema validation
            itemName: "",
            categoryId: "null", // Use "null" string instead of null
            unit: "", // Will be populated and made read-only in edit mode
            purchasePrice: undefined,
            sellingPrice: undefined,
            initialStock: 0,
            reorder_point: null,
            description: "",
        },
        mode: "onChange",
    });

    // Reset form when navigating between items only once at the beginning
    useEffect(() => {
        setDataLoaded(false);
        // When itemId changes, only reset form once
        form.reset({
            id: itemId,
            itemName: "",
            categoryId: "null",
            unit: "",
            purchasePrice: undefined,
            sellingPrice: undefined,
            initialStock: 0,
            reorder_point: null,
            description: "",
        });

        // Reset display category
        setDisplayCategoryId("null");
    }, [itemId, form]);

    // Add debug logging for itemData when it loads
    useEffect(() => {
        if (isEditing && itemData) {
            console.log("🔍 Item Data Loaded:", {
                id: itemData.id,
                name: itemData.item_name,
                category_id: itemData.category_id,
                category_id_type: typeof itemData.category_id,
            });

            // Get the exact category ID directly from the item data
            const categoryIdValue = itemData.category_id
                ? String(itemData.category_id)
                : "null";

            // Set the display category immediately when data loads
            setDisplayCategoryId(categoryIdValue);

            // Reset form with the data from the API
            form.reset(
                {
                    id: itemData.id,
                    itemName: itemData.item_name || "",
                    categoryId: categoryIdValue,
                    unit: itemData.unit || "",
                    purchasePrice: itemData.purchase_price ?? undefined,
                    sellingPrice: itemData.selling_price ?? undefined,
                    reorder_point: itemData.reorder_point ?? null,
                    description: itemData.description || "",
                },
                {
                    // Prevent the form from marking fields as dirty when we set values
                    keepDirty: false,
                    // Keep focus on current field if user is typing
                    keepValues: false,
                }
            );

            setDataLoaded(true);
        }
    }, [isEditing, itemData, form]);

    // Create or update mutation
    const mutation = useMutation({
        mutationFn: (values: CombinedInventoryItemFormValues) => {
            console.log("🔍 Form submission values:", values);

            if (isEditing && values.id) {
                // Prepare data based on update schema by extracting just what we need
                const updateData: Omit<InventoryItemUpdateFormValues, "id"> = {
                    itemName: values.itemName,
                    // Handle category null value consistently
                    categoryId:
                        values.categoryId === "null" ? null : values.categoryId,
                    sellingPrice: Number(values.sellingPrice ?? 0),
                    purchasePrice: Number(values.purchasePrice ?? 0),
                    reorder_point:
                        values.reorder_point === null
                            ? null
                            : Number(values.reorder_point),
                    description: values.description || null,
                };

                console.log("🔍 Sending update data:", updateData);
                return updateInventoryItem(values.id, updateData);
            } else {
                // Prepare data based on create schema
                const createData: InventoryItemCreateFormValues = {
                    itemName: values.itemName,
                    // Handle category null value consistently
                    categoryId:
                        values.categoryId === "null" ? null : values.categoryId,
                    unit: values.unit, // Unit is required for create
                    sellingPrice: Number(values.sellingPrice ?? 0),
                    purchasePrice: Number(values.purchasePrice ?? 0),
                    initialStock: Number(values.initialStock ?? 0),
                    reorder_point:
                        values.reorder_point === null
                            ? null
                            : Number(values.reorder_point),
                    description: values.description || null,
                };

                return createInventoryItem(createData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
            if (isEditing) {
                queryClient.invalidateQueries({
                    queryKey: ["inventoryItem", itemId],
                });
            }
            toast.success(
                `Item ${isEditing ? "updated" : "added"} successfully!`
            );
            onSuccess?.();
        },
        onError: (error) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";

            // Check for specific error messages from backend
            if (errorMessage.includes("Item name already exists")) {
                form.setError("itemName", {
                    type: "manual",
                    message: "This item name is already taken.",
                });
                setServerError(null); // Clear generic server error if specific field error is set
            } else if (errorMessage.includes("Category not found")) {
                form.setError("categoryId", {
                    type: "manual",
                    message: "The selected category does not exist.",
                });
                setServerError(null);
            } else {
                setServerError(errorMessage); // Show generic error if not specific
            }
        },
    });

    // Handle form submission
    const onSubmit = (values: CombinedInventoryItemFormValues) => {
        // Use displayCategoryId for submission
        const formData = {
            ...values,
            categoryId: displayCategoryId || "null",
        };

        setServerError(null);
        mutation.mutate(formData);
    };

    // Combined loading state
    const isLoading = (isEditing && isLoadingItem) || isLoadingCategories;

    if (isEditing && itemError) {
        return (
            <p className="p-4 text-destructive">
                Error loading item data:{" "}
                {itemError instanceof Error
                    ? itemError.message
                    : "Unknown error"}
            </p>
        );
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 px-1 py-2"
            >
                {serverError && (
                    <div className="bg-destructive/10 p-3 rounded-md border border-destructive text-sm text-destructive mb-4">
                        {serverError}
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
                    <>
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
                                                className="pl-9"
                                                {...field}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Category & Unit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => {
                                    // Safe category display ID - protect against empty string
                                    const safeCategoryId =
                                        !displayCategoryId ||
                                        displayCategoryId === ""
                                            ? "null"
                                            : displayCategoryId;

                                    console.log("🔍 Category field render:", {
                                        fieldValue: field.value,
                                        displayCategoryId,
                                        safeCategoryId,
                                        dataLoaded,
                                    });

                                    // Find the category name for display
                                    const selectedCategoryInfo =
                                        safeCategoryId !== "null"
                                            ? categories.find(
                                                  (c) =>
                                                      String(c.id) ===
                                                      safeCategoryId
                                              )
                                            : null;

                                    const categoryName =
                                        selectedCategoryInfo?.name || "";

                                    // Direct hardcoded solution to prevent any auto-resets
                                    return (
                                        <FormItem className="space-y-2">
                                            <FormLabel>
                                                Category (Optional)
                                            </FormLabel>

                                            {/* Custom Select replacement with enhanced styling */}
                                            <div className="relative">
                                                <select
                                                    className={cn(
                                                        "w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm",
                                                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                                                        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                                        "appearance-none pr-8" // Add space for the chevron
                                                    )}
                                                    value={safeCategoryId}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value;
                                                        console.log(
                                                            "Direct category selected:",
                                                            value
                                                        );

                                                        // Update both our state and react-hook-form
                                                        setDisplayCategoryId(
                                                            value
                                                        );
                                                        field.onChange(value);

                                                        // Clear any validation errors
                                                        if (
                                                            form.formState
                                                                .errors
                                                                .categoryId
                                                        ) {
                                                            form.clearErrors(
                                                                "categoryId"
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <option
                                                        value="null"
                                                        className="text-muted-foreground"
                                                    >
                                                        -- No Category --
                                                    </option>
                                                    {categories.map(
                                                        (category) => (
                                                            <option
                                                                key={
                                                                    category.id
                                                                }
                                                                value={String(
                                                                    category.id
                                                                )}
                                                            >
                                                                {category.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {/* Add a custom chevron */}
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                                            </div>

                                            <FormDescription className="text-xs">
                                                Group similar items together.
                                                {safeCategoryId !== "null" &&
                                                    categoryName && (
                                                        <span className="ml-1 font-medium">
                                                            Current:{" "}
                                                            {categoryName}
                                                        </span>
                                                    )}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., pcs, kg, m, box"
                                        value={form.watch("unit")} // Display value
                                        readOnly={isEditing} // Make read-only when editing
                                        onChange={(e) =>
                                            !isEditing &&
                                            form.setValue(
                                                "unit",
                                                e.target.value
                                            )
                                        } // Allow change only if NOT editing
                                        className={cn(
                                            isEditing &&
                                                "bg-muted/50 cursor-not-allowed border-dashed"
                                        )}
                                    />
                                </FormControl>
                                {!isEditing ? (
                                    <FormDescription className="text-xs">
                                        Unit of measurement for stock.
                                    </FormDescription>
                                ) : (
                                    <FormDescription className="text-xs text-muted-foreground italic">
                                        Unit cannot be changed after creation.
                                    </FormDescription>
                                )}
                                {/* Only show error if NOT editing */}
                                {!isEditing && (
                                    <FormMessage>
                                        {form.formState.errors.unit?.message}
                                    </FormMessage>
                                )}
                            </FormItem>
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purchase Price</FormLabel>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormDescription className="text-xs">
                                            Default cost to restock this item.
                                        </FormDescription>
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
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Stock & Reorder Point */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!isEditing ? (
                                <FormField
                                    control={form.control}
                                    name="initialStock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Stock</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="0"
                                                    {...field}
                                                    value={field.value ?? "0"}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Current quantity on hand.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormItem>
                                    <FormLabel>Current Stock</FormLabel>
                                    <FormControl>
                                        <Input
                                            readOnly
                                            value={`${
                                                itemData?.stock_quantity ??
                                                "N/A"
                                            } ${itemData?.unit ?? ""}`}
                                            className="bg-muted/50 cursor-not-allowed border-dashed"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs italic">
                                        Adjust stock via the &apos;Adjust
                                        Stock&apos; action.
                                    </FormDescription>
                                </FormItem>
                            )}
                            <FormField
                                control={form.control}
                                name="reorder_point"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Reorder Point (Optional)
                                        </FormLabel>
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
                                                            e.target.value ===
                                                                ""
                                                                ? null
                                                                : parseInt(
                                                                      e.target
                                                                          .value,
                                                                      10
                                                                  )
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                        </div>
                                        <FormDescription className="text-xs">
                                            Stock level to trigger reorder
                                            warning.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Optional Fields: Description only (removed sku, barcode) */}
                        <div className="space-y-4 pt-2 border-t border-dashed mt-4">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Description (Optional)
                                        </FormLabel>
                                        <div className="relative">
                                            <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add details about the item..."
                                                    className="min-h-[80px] pl-9"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

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
                        ) : isEditing ? (
                            "Save Changes"
                        ) : (
                            "Add Item"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
