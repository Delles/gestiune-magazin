// src/app/(authenticated)/inventory/_components/inline-edit-form.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    inventoryItemUpdateSchema,
    type InventoryItemUpdateFormValues,
} from "@/lib/validation/inventory-schemas";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import type { Category, InventoryItem } from "../../types/types"; // Import types
import { updateInventoryItem } from "../../_data/api";
// --- Props Interface ---
interface InlineEditFormRowProps {
    item: InventoryItem;
    categories: Category[];
    onSave: () => void;
    onCancel: () => void;
    density: "compact" | "normal" | "comfortable";
    visibleColumns: string[]; // IDs of currently visible columns
}

// --- Main Component ---
const InlineEditFormRow = React.memo(
    ({
        item,
        categories,
        onSave,
        onCancel,
        density,
        visibleColumns,
    }: InlineEditFormRowProps) => {
        const queryClient = useQueryClient();
        const formId = `inline-edit-form-${item.id}`; // Unique ID for the form

        const form = useForm<InventoryItemUpdateFormValues>({
            resolver: zodResolver(inventoryItemUpdateSchema),
            defaultValues: {
                id: item.id,
                itemName: item.item_name || "",
                categoryId: item.category_id ?? null,
                sellingPrice: item.selling_price ?? undefined,
                reorder_point: item.reorder_point ?? null,
                description: item.description || "",
            },
            mode: "onChange",
        });

        const mutation = useMutation({
            mutationFn: (values: InventoryItemUpdateFormValues) =>
                updateInventoryItem(item.id, values),
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
                queryClient.invalidateQueries({
                    queryKey: ["inventoryItem", item.id],
                });
                queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
                toast.success(data.message || "Item updated successfully!");
                onSave(); // Call the callback provided by InventoryList
            },
            onError: (error) => {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred";
                toast.error(`Update failed: ${errorMessage}`);
                if (errorMessage.includes("Conflict")) {
                    form.setError("itemName", {
                        type: "manual",
                        message: "Name conflict",
                    });
                } else if (errorMessage.includes("Category not found")) {
                    form.setError("categoryId", {
                        type: "manual",
                        message: "Invalid category",
                    });
                }
            },
        });

        const onSubmit = (values: InventoryItemUpdateFormValues) => {
            const dataToSend = {
                ...values,
                categoryId:
                    values.categoryId === "null" ? null : values.categoryId,
                description: values.description ?? item.description ?? null,
            };
            mutation.mutate(dataToSend);
        };

        // Function to render cell content based on column ID
        const renderCellContent = (columnId: string) => {
            const densityTextClasses = {
                "text-xs": density === "compact",
                "text-sm": density === "normal",
            };

            switch (columnId) {
                case "select":
                    return (
                        <Checkbox
                            checked={false}
                            disabled
                            aria-label="Select row disabled"
                            className="translate-y-[2px] opacity-50"
                        />
                    );
                case "item_name":
                    return (
                        <FormField
                            control={form.control}
                            name="itemName"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="relative">
                                        <Package className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                placeholder="Item Name"
                                                className={cn(
                                                    "pl-7 h-8",
                                                    densityTextClasses
                                                )}
                                                {...field}
                                                form={formId}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-xs mt-0.5" />
                                </FormItem>
                            )}
                        />
                    );
                case "category_name":
                    return (
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <Select
                                        onValueChange={(value) =>
                                            field.onChange(
                                                value === "null" ? null : value
                                            )
                                        }
                                        value={field.value ?? "null"}
                                    >
                                        <FormControl>
                                            <SelectTrigger
                                                className={cn(
                                                    "h-8 truncate",
                                                    densityTextClasses
                                                )}
                                            >
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="null">
                                                -- No Category --
                                            </SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-xs mt-0.5" />
                                </FormItem>
                            )}
                        />
                    );
                case "stock_quantity":
                    return (
                        <div className="flex flex-col items-start w-32 opacity-70">
                            <div className="flex items-baseline gap-1 w-full">
                                <span
                                    className={cn(
                                        "font-semibold",
                                        density === "comfortable"
                                            ? "text-lg"
                                            : "text-base"
                                    )}
                                >
                                    {item.stock_quantity}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {item.unit}
                                </span>
                            </div>
                            <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1 cursor-default"></div>
                        </div>
                    );
                case "initial_purchase_price":
                    return (
                        <div
                            className={cn(
                                "text-right font-mono opacity-70",
                                densityTextClasses
                            )}
                        >
                            {formatCurrency(item.initial_purchase_price)}
                        </div>
                    );
                case "last_purchase_price":
                    return (
                        <div
                            className={cn(
                                "text-right font-mono opacity-70",
                                densityTextClasses
                            )}
                        >
                            {formatCurrency(item.last_purchase_price)}
                        </div>
                    );
                case "selling_price":
                    return (
                        <FormField
                            control={form.control}
                            name="sellingPrice"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="0.00"
                                                className={cn(
                                                    "pl-7 h-8 text-right",
                                                    densityTextClasses
                                                )}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(
                                                                  e.target.value
                                                              )
                                                    )
                                                }
                                                form={formId}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-xs mt-0.5" />
                                </FormItem>
                            )}
                        />
                    );
                case "actions":
                    return (
                        <div className="flex justify-end gap-1 items-center h-full pr-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={onCancel}
                                disabled={mutation.isPending}
                                aria-label="Cancel edit"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                                form={formId}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                <span className="sr-only">Save Changes</span>
                            </Button>
                            <form
                                id={formId}
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="hidden"
                            ></form>
                        </div>
                    );
                default:
                    // Fallback for other columns
                    const value = (item as Record<string, unknown>)[columnId];
                    return (
                        <span className={cn("opacity-70", densityTextClasses)}>
                            {value !== null && value !== undefined
                                ? String(value)
                                : "-"}
                        </span>
                    );
            }
        };

        // Define density-based padding for cells
        const cellPaddingClasses = cn({
            "px-2 py-1": density === "compact",
            "px-3 py-1.5": density === "normal",
            "px-4 py-2": density === "comfortable",
        });

        // Define column specific width classes separately
        const getColumnWidthClass = (columnId: string): string => {
            switch (columnId) {
                case "select":
                    return "w-[50px]";
                case "category_name":
                    return "w-[120px]";
                case "selling_price":
                    return "w-[100px]";
                case "actions":
                    return "w-[120px]";
                default:
                    return "";
            }
        };

        return (
            <Form {...form}>
                <TableRow
                    data-state="editing"
                    className="bg-muted/30 hover:bg-muted/40"
                >
                    {visibleColumns.map((columnId) => (
                        <TableCell
                            key={`${item.id}-${columnId}-edit`}
                            className={cn(
                                "align-middle",
                                cellPaddingClasses,
                                getColumnWidthClass(columnId)
                            )}
                        >
                            {renderCellContent(columnId)}
                        </TableCell>
                    ))}
                </TableRow>
            </Form>
        );
    }
);
InlineEditFormRow.displayName = "InlineEditFormRow";

export default InlineEditFormRow;
