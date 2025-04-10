"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CalendarIcon,
    Store,
    MinusCircle,
    Trash2,
    DollarSign,
    AlertTriangle,
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
import { formatCurrency } from "@/lib/utils";

// Schema and Services
import {
    decreaseStockSchema,
    type DecreaseStockFormValues,
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
        value: "sale",
        label: "Sale",
        description: "Record a manual sale",
        icon: <Store className="h-4 w-4" />,
        requiresPrice: true,
    },
    {
        value: "write-off",
        label: "Write-Off",
        description: "Items damaged, lost, or expired",
        icon: <Trash2 className="h-4 w-4" />,
        requiresPrice: true,
    },
    {
        value: "correction-remove",
        label: "Correction (Remove)",
        description: "Correct inventory count",
        icon: <MinusCircle className="h-4 w-4" />,
        requiresPrice: false,
    },
];

interface DecreaseStockFormProps {
    itemId: string;
    itemName: string;
    unit: string;
    currentStock: number;
    averagePurchasePrice?: number | null;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function DecreaseStockForm({
    itemId,
    itemName,
    unit,
    currentStock,
    averagePurchasePrice = null,
    onSuccess,
    onClose,
}: DecreaseStockFormProps) {
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<DecreaseStockFormValues>({
        resolver: zodResolver(decreaseStockSchema),
        defaultValues: {
            transactionType: "sale",
            quantity: 1,
            sellingPrice: null,
            itemCost: null,
            totalValue: null,
            referenceNumber: "",
            reason: "",
        },
        mode: "onChange",
    });

    const selectedTransactionType = form.watch("transactionType");
    const quantity = form.watch("quantity");

    const isSale = selectedTransactionType === "sale";
    const isWriteOff = selectedTransactionType === "write-off";
    const isCorrection = selectedTransactionType === "correction-remove";

    const showPriceFields = isSale || isWriteOff;
    const showReasonRequired = isWriteOff || isCorrection;

    // Calculate estimated new stock for preview
    const newStock = Math.max(0, currentStock - quantity);

    // Set default item cost when transaction type changes to write-off
    useEffect(() => {
        if (
            isWriteOff &&
            averagePurchasePrice !== null &&
            averagePurchasePrice > 0
        ) {
            form.setValue("itemCost", averagePurchasePrice, {
                shouldValidate: false,
            });

            // Also update total value if quantity is set
            if (quantity > 0) {
                const newTotal = Number(
                    (quantity * averagePurchasePrice).toFixed(2)
                );
                form.setValue("totalValue", newTotal, {
                    shouldValidate: false,
                });
            }
        }
    }, [
        selectedTransactionType,
        averagePurchasePrice,
        form,
        quantity,
        isWriteOff,
    ]);

    // START: Dynamic Reason Placeholder
    let reasonPlaceholder = "Optional notes...";
    if (isWriteOff)
        reasonPlaceholder = "Required: e.g., Damaged in storage, Expired";
    if (isCorrection)
        reasonPlaceholder = "Required: e.g., Cycle count adjustment";
    // END: Dynamic Reason Placeholder

    // Add validation for available stock
    useEffect(() => {
        if (quantity > currentStock) {
            form.setError("quantity", {
                type: "manual",
                message: `Cannot remove more than available stock (${currentStock} ${unit}).`,
            });
        } else {
            if (form.formState.errors.quantity?.type === "manual") {
                form.clearErrors("quantity");
            }
        }
    }, [quantity, currentStock, unit, form]);

    const handleQuantityChange = (qtyValue: string | number) => {
        const newQty = qtyValue === "" ? 1 : Number(qtyValue);
        // Clamp the quantity to be between 0.01 and the current stock
        const clampedQty = Math.min(currentStock, Math.max(0.01, newQty));

        form.setValue("quantity", clampedQty, {
            shouldValidate: true,
            shouldDirty: true,
        });

        // Update total value based on unit price if available
        if (showPriceFields) {
            if (isSale) {
                const sellingPrice = form.getValues("sellingPrice");
                if (sellingPrice !== null && sellingPrice !== undefined) {
                    const newTotal = Number(
                        (clampedQty * sellingPrice).toFixed(2)
                    );
                    form.setValue("totalValue", newTotal, {
                        shouldValidate: true,
                    });
                }
            } else if (isWriteOff) {
                const itemCost = form.getValues("itemCost");
                if (itemCost !== null && itemCost !== undefined) {
                    const newTotal = Number((clampedQty * itemCost).toFixed(2));
                    form.setValue("totalValue", newTotal, {
                        shouldValidate: true,
                    });
                }
            }
        }
    };

    const handleUnitPriceChange = (
        value: string | number,
        field: "sellingPrice" | "itemCost"
    ) => {
        const unitPrice = value === "" ? null : Number(value);
        form.setValue(field, unitPrice, {
            shouldValidate: true,
            shouldDirty: true,
        });

        // Update total value if quantity is available
        if (unitPrice !== null) {
            const newTotal = Number((quantity * unitPrice).toFixed(2));
            form.setValue("totalValue", newTotal, { shouldValidate: true });
        } else {
            form.setValue("totalValue", null, { shouldValidate: true });
        }
    };

    const handleTotalValueChange = (value: string | number) => {
        const totalValue = value === "" ? null : Number(value);
        form.setValue("totalValue", totalValue, {
            shouldValidate: true,
            shouldDirty: true,
        });

        // Update unit price if quantity is available and not zero
        if (totalValue !== null && quantity > 0) {
            const newUnitPrice = Number((totalValue / quantity).toFixed(2));

            if (isSale) {
                form.setValue("sellingPrice", newUnitPrice, {
                    shouldValidate: true,
                });
            } else if (isWriteOff) {
                form.setValue("itemCost", newUnitPrice, {
                    shouldValidate: true,
                });
            }
        }
    };

    const mutation = useMutation({
        mutationFn: (values: DecreaseStockFormValues) => {
            // Form values are already in the right format, no need to convert
            return adjustInventoryItemStock(itemId, {
                transactionType: values.transactionType, // Use the form value directly
                quantity: values.quantity,
                date: values.date,
                sellingPrice: values.sellingPrice,
                itemCost: values.itemCost,
                totalValue: values.totalValue,
                referenceNumber: values.referenceNumber || null,
                reason: values.reason || null,
            });
        },
        onSuccess: () => {
            toast.success("Stock adjusted successfully");
            // Reset the form
            form.reset({
                transactionType: "sale",
                quantity: 1,
                sellingPrice: null,
                itemCost: null,
                totalValue: null,
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

    const onSubmit = (values: DecreaseStockFormValues) => {
        // Extra validation to ensure we don't exceed available stock
        if (values.quantity > currentStock) {
            form.setError("quantity", {
                type: "manual",
                message: `Cannot remove more than available stock (${currentStock} ${unit}).`,
            });
            return;
        }

        setServerError(null);
        mutation.mutate({
            ...values,
            date: new Date(),
        });
    };

    return (
        <div className="min-w-[600px] bg-background">
            <div className="p-3 pb-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium leading-none">
                            Decrease Stock: {itemName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Current: {currentStock} {unit}(s)
                        </p>
                    </div>
                    <div className="text-sm bg-muted px-2 py-1 rounded">
                        New: <span className="font-medium">{newStock}</span>{" "}
                        {unit}(s)
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
                        className="space-y-3"
                    >
                        <div className="grid grid-cols-5 gap-3">
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
                                                        // Reset price fields when type changes
                                                        form.setValue(
                                                            "sellingPrice",
                                                            null
                                                        );
                                                        form.setValue(
                                                            "itemCost",
                                                            null
                                                        );
                                                        form.setValue(
                                                            "totalValue",
                                                            null
                                                        );
                                                    }}
                                                    defaultValue={field.value}
                                                    className="flex space-x-3"
                                                >
                                                    {TRANSACTION_TYPES.map(
                                                        (type) => (
                                                            <FormItem
                                                                key={type.value}
                                                                className="flex items-center space-x-1.5 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <RadioGroupItem
                                                                        value={
                                                                            type.value
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal flex items-center gap-1 cursor-pointer m-0 text-sm">
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

                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                Quantity *
                                                {currentStock < 5 && (
                                                    <span className="text-amber-500 text-xs flex items-center">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Low stock
                                                    </span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    max={currentStock}
                                                    step="any"
                                                    placeholder={`In ${unit}`}
                                                    {...field}
                                                    value={field.value}
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            e.target.value
                                                        )
                                                    }
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
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "PP"
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
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={
                                                            field.value as Date
                                                        }
                                                        onSelect={(date) =>
                                                            field.onChange(
                                                                date ||
                                                                    new Date()
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

                        {showPriceFields && (
                            <div className="grid grid-cols-5 gap-3">
                                <TooltipProvider>
                                    <div className="col-span-2">
                                        {isSale ? (
                                            <FormField
                                                control={form.control}
                                                name="sellingPrice"
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
                                                                        Enter
                                                                        either
                                                                        unit
                                                                        price or
                                                                        total
                                                                        value
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
                                                                    handleUnitPriceChange(
                                                                        e.target
                                                                            .value,
                                                                        "sellingPrice"
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="itemCost"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                                            Value Lost
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
                                                                        Default
                                                                        is the
                                                                        average
                                                                        purchase
                                                                        price
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                placeholder="Cost per unit"
                                                                {...field}
                                                                value={
                                                                    field.value ===
                                                                    null
                                                                        ? ""
                                                                        : field.value
                                                                }
                                                                onChange={(e) =>
                                                                    handleUnitPriceChange(
                                                                        e.target
                                                                            .value,
                                                                        "itemCost"
                                                                    )
                                                                }
                                                                readOnly={
                                                                    isWriteOff
                                                                }
                                                                className={cn(
                                                                    isWriteOff &&
                                                                        "bg-muted/70 cursor-not-allowed border-dashed"
                                                                )}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                        {isWriteOff &&
                                                            averagePurchasePrice !==
                                                                null && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger className="w-full text-left">
                                                                            <p className="text-xs text-muted-foreground pl-1 pt-1">
                                                                                (Derived
                                                                                from
                                                                                Avg.
                                                                                Cost:
                                                                                <span className="font-mono">
                                                                                    {formatCurrency(
                                                                                        averagePurchasePrice
                                                                                    )}
                                                                                </span>

                                                                                )
                                                                            </p>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="bottom">
                                                                            <p className="text-xs">
                                                                                For
                                                                                write-offs,
                                                                                the
                                                                                cost
                                                                                is
                                                                                based
                                                                                on
                                                                                the
                                                                                average
                                                                                purchase
                                                                                price.
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name="totalValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {isSale
                                                            ? "Total Sale Value"
                                                            : "Total Value Lost"}
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
                                                            placeholder="Total value"
                                                            {...field}
                                                            value={
                                                                field.value ===
                                                                null
                                                                    ? ""
                                                                    : field.value
                                                            }
                                                            onChange={(e) =>
                                                                handleTotalValueChange(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TooltipProvider>
                            </div>
                        )}

                        {/* START: Cost Impact Preview */}
                        {isWriteOff &&
                            quantity > 0 &&
                            averagePurchasePrice !== null && (
                                <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded border border-dashed">
                                    Estimated Value Lost:{" "}
                                    <span className="font-medium text-destructive">
                                        {formatCurrency(
                                            quantity * averagePurchasePrice
                                        )}
                                    </span>
                                    <span className="text-xs">
                                        {" "}
                                        (Based on Avg. Cost)
                                    </span>
                                </div>
                            )}
                        {/* END: Cost Impact Preview */}

                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-2">
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
                                                <Input
                                                    placeholder={
                                                        reasonPlaceholder
                                                    }
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Hidden submit button for form handling */}
                        <button type="submit" className="sr-only">
                            Submit
                        </button>
                    </form>
                </Form>
            </div>

            {/* Footer with buttons */}
            <div className="flex items-center justify-end gap-2 p-3 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={mutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={mutation.isPending || currentStock <= 0}
                    className="gap-1"
                >
                    {mutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Confirm
                </Button>
            </div>
        </div>
    );
}
