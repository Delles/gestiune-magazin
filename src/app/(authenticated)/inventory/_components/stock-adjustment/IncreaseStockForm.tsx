"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CalendarIcon,
    ShoppingCart,
    PlusCircle,
    DollarSign,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";

// Shadcn UI Components
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Schema and Services
import {
    increaseStockSchema,
    type IncreaseStockFormValues,
    type StockAdjustmentFormTransactionType,
} from "@/lib/validation/inventory-schemas";
import { adjustInventoryItemStock } from "@/services/inventoryService";

interface TransactionTypeConfig {
    value: StockAdjustmentFormTransactionType;
    label: string;
    description: string;
    icon: React.ReactNode;
    requiresPrice: boolean;
}

const TRANSACTION_TYPES: TransactionTypeConfig[] = [
    {
        value: "purchase",
        label: "Purchase",
        description: "Stock received from supplier",
        icon: <ShoppingCart className="h-4 w-4" />,
        requiresPrice: true,
    },
    {
        value: "correction-add",
        label: "Correction (Add)",
        description: "Correct inventory count",
        icon: <PlusCircle className="h-4 w-4" />,
        requiresPrice: false,
    },
];

interface IncreaseStockFormProps {
    itemId: string;
    itemName: string;
    unit: string;
    currentStock: number;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function IncreaseStockForm({
    itemId,
    itemName,
    unit,
    currentStock,
    onSuccess,
    onClose,
}: IncreaseStockFormProps) {
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<IncreaseStockFormValues>({
        resolver: zodResolver(increaseStockSchema),
        defaultValues: {
            transactionType: "purchase",
            quantity: 1,
            purchasePrice: null,
            totalCost: null,
            referenceNumber: "",
            reason: "",
        },
    });

    const selectedTransactionType = form.watch("transactionType");
    const quantity = form.watch("quantity");
    const showPriceFields = selectedTransactionType === "purchase";
    const showReasonRequired = selectedTransactionType === "correction-add";

    // START: Dynamic Reason Placeholder
    let reasonPlaceholder = "Optional notes...";
    if (showReasonRequired)
        reasonPlaceholder =
            "Required: e.g., Found extra stock, Cycle count correction";
    // END: Dynamic Reason Placeholder

    // Calculate estimated new stock for preview
    const newStock = currentStock + quantity;

    const handleQuantityChange = (qtyValue: string | number) => {
        const newQty = qtyValue === "" ? 1 : Number(qtyValue);
        form.setValue("quantity", Math.max(0.01, newQty), {
            shouldValidate: true,
            shouldDirty: true,
        });

        // Update total cost based on purchase price if available
        if (showPriceFields) {
            const purchasePrice = form.getValues("purchasePrice");
            if (purchasePrice !== null && purchasePrice !== undefined) {
                const newTotal = Number((newQty * purchasePrice).toFixed(2));
                form.setValue("totalCost", newTotal, { shouldValidate: true });
            }
        }
    };

    const handlePurchasePriceChange = (value: string | number) => {
        const unitPrice = value === "" ? null : Number(value);
        form.setValue("purchasePrice", unitPrice, {
            shouldValidate: true,
            shouldDirty: true,
        });

        if (unitPrice !== null) {
            const newTotal = Number((quantity * unitPrice).toFixed(2));
            form.setValue("totalCost", newTotal, { shouldValidate: true });
        } else {
            form.setValue("totalCost", null, { shouldValidate: true });
        }
    };

    const handleTotalCostChange = (value: string | number) => {
        const totalValue = value === "" ? null : Number(value);
        form.setValue("totalCost", totalValue, {
            shouldValidate: true,
            shouldDirty: true,
        });

        if (totalValue !== null && quantity > 0) {
            const newUnitPrice = Number((totalValue / quantity).toFixed(2));
            form.setValue("purchasePrice", newUnitPrice, {
                shouldValidate: true,
            });
        } else {
            form.setValue("purchasePrice", null, { shouldValidate: true });
        }
    };

    const mutation = useMutation({
        mutationFn: (values: IncreaseStockFormValues) => {
            // The form type for transactionType matches what the service expects directly
            // No need to map the values as the service handles this mapping
            return adjustInventoryItemStock(itemId, {
                quantity: values.quantity,
                transactionType: values.transactionType,
                date: values.date,
                purchasePrice: values.purchasePrice,
                totalCost: values.totalCost,
                referenceNumber: values.referenceNumber || null,
                reason: values.reason || null,
            });
        },
        onSuccess: () => {
            toast.success("Stock adjusted successfully");
            // Reset the form
            form.reset({
                transactionType: "purchase",
                quantity: 1,
                purchasePrice: null,
                totalCost: null,
                referenceNumber: "",
                reason: "",
            });
            // Invalidate relevant queries to refresh the data
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ["stockTransactions", itemId],
            });
            // Call parent's onSuccess if provided
            if (onSuccess) onSuccess();
        },
        onError: (error: Error) => {
            setServerError(error.message);
            toast.error(`Failed to adjust stock: ${error.message}`);
        },
    });

    const onSubmit = (values: IncreaseStockFormValues) => {
        setServerError(null);
        mutation.mutate({
            ...values,
            date: new Date(),
        });
    };

    return (
        <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium leading-none">
                        Increase Stock: {itemName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Current: {currentStock} {unit}(s)
                    </p>
                </div>
                <div className="text-sm bg-muted px-2 py-1 rounded">
                    New: <span className="font-medium">{newStock}</span> {unit}
                    (s)
                </div>
            </div>

            {serverError && (
                <div className="bg-destructive/15 text-destructive text-sm p-2 rounded-md mb-3">
                    {serverError}
                </div>
            )}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 pt-2"
                >
                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-5">
                            <FormField
                                control={form.control}
                                name="transactionType"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel>Type *</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(
                                                    value: StockAdjustmentFormTransactionType
                                                ) => {
                                                    field.onChange(value);
                                                    if (
                                                        value ===
                                                        "correction-add"
                                                    ) {
                                                        form.setValue(
                                                            "purchasePrice",
                                                            null
                                                        );
                                                        form.setValue(
                                                            "totalCost",
                                                            null
                                                        );
                                                    }
                                                }}
                                                defaultValue={field.value}
                                                className="flex space-x-3 pt-1"
                                            >
                                                {TRANSACTION_TYPES.map(
                                                    (type) => (
                                                        <FormItem
                                                            key={type.value}
                                                            className="flex items-center space-x-2 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <RadioGroupItem
                                                                    value={
                                                                        type.value
                                                                    }
                                                                    className={cn(
                                                                        "shadow-soft-inner bg-input border border-border",
                                                                        "focus:ring-primary/80 focus:ring-offset-0 focus:ring-2",
                                                                        "data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary"
                                                                    )}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal flex items-center gap-1.5 cursor-pointer m-0 text-sm">
                                                                {type.icon}
                                                                {type.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                )}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="any"
                                                placeholder={`In ${unit}`}
                                                {...field}
                                                value={field.value}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="col-span-3">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal justify-start",
                                                            "shadow-soft-inner bg-input border border-border",
                                                            "focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP"
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        field.value as Date
                                                    }
                                                    onSelect={(date) =>
                                                        field.onChange(
                                                            date || new Date()
                                                        )
                                                    }
                                                    disabled={(date) =>
                                                        date > new Date() ||
                                                        date <
                                                            new Date(
                                                                "1900-01-01"
                                                            )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        {showPriceFields && (
                            <>
                                <div className="col-span-2">
                                    <TooltipProvider>
                                        <FormField
                                            control={form.control}
                                            name="purchasePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Unit Price
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="cursor-help text-muted-foreground text-xs">
                                                                    ⓘ
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p className="w-[180px] text-xs">
                                                                    Enter either
                                                                    unit price
                                                                    or total
                                                                    cost
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            placeholder="Price per unit"
                                                            {...field}
                                                            value={
                                                                field.value ===
                                                                null
                                                                    ? ""
                                                                    : field.value
                                                            }
                                                            onChange={(e) =>
                                                                handlePurchasePriceChange(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TooltipProvider>
                                </div>

                                <div className="col-span-2">
                                    <TooltipProvider>
                                        <FormField
                                            control={form.control}
                                            name="totalCost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Total Cost
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="cursor-help text-muted-foreground text-xs">
                                                                    ⓘ
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p className="w-[180px] text-xs">
                                                                    Updates
                                                                    based on
                                                                    quantity ×
                                                                    unit price
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            placeholder="Total cost"
                                                            {...field}
                                                            value={
                                                                field.value ===
                                                                null
                                                                    ? ""
                                                                    : field.value
                                                            }
                                                            onChange={(e) =>
                                                                handleTotalCostChange(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TooltipProvider>
                                </div>
                            </>
                        )}

                        <div
                            className={
                                showPriceFields
                                    ? "col-span-2 col-start-1"
                                    : "col-span-2"
                            }
                        >
                            <FormField
                                control={form.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference #</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Invoice or reference #"
                                                {...field}
                                                value={field.value || ""}
                                                className="shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div
                            className={
                                showPriceFields ? "col-span-3" : "col-span-3"
                            }
                        >
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel
                                            className={cn({
                                                "after:content-['*'] after:ml-0.5 after:text-destructive":
                                                    showReasonRequired,
                                            })}
                                        >
                                            Reason / Notes
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={reasonPlaceholder}
                                                rows={3}
                                                className="resize-none shadow-soft-inner bg-input border border-border focus-visible:ring-primary/80 focus-visible:ring-offset-0 focus-visible:ring-2"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

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
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Submit Adjustment
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
