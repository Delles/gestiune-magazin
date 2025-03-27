"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    stockAdjustmentSchema,
    type StockAdjustmentFormValues,
    type TransactionType,
} from "@/lib/validation/inventory-schemas";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Minus,
    Check,
    AlertTriangle,
    CalendarIcon,
    Hash,
} from "lucide-react";
import { FormHeader } from "./form-header";
import { TransactionTypeSelector } from "./transaction-type-selector";
import { SubmitButton } from "./submit-button";
import {
    needsPriceFields,
    adjustStock,
    type StockAdjustmentFormProps,
} from "./utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export default function StockAdjustmentForm({
    itemId,
    itemName,
    unit,
    currentStock,
    onSuccess,
    initialType = "increase",
}: StockAdjustmentFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const queryClient = useQueryClient();

    // Default transaction type based on initial type
    const defaultTransactionType =
        initialType === "increase" ? "purchase" : "sale";

    // Initialize react-hook-form
    const form = useForm<StockAdjustmentFormValues>({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: {
            type: initialType,
            transactionType: defaultTransactionType,
            quantity: 0,
            purchasePrice: null,
            sellingPrice: null,
            totalPrice: null,
            referenceNumber: "",
            reason: "",
            date: new Date(),
        },
    });

    // Watch fields for conditional rendering
    const stockActionType = form.watch("type");
    const transactionType = form.watch("transactionType") as TransactionType;
    const quantity = form.watch("quantity");
    const date = form.watch("date");

    // Check if we need price fields
    const showPriceFields = needsPriceFields(transactionType);

    // Create mutation for stock adjustment
    const mutation = useMutation({
        mutationFn: (values: StockAdjustmentFormValues) =>
            adjustStock(itemId, values),
        onSuccess: () => {
            // Invalidate the inventory items query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            // Show success message
            setShowSuccess(true);
            // Hide success message after 3 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
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

    // Handle form submission
    const onSubmit = form.handleSubmit((values) => {
        setServerError(null);

        // Validate decrease doesn't exceed current stock
        if (values.type === "decrease" && values.quantity > currentStock) {
            setServerError(
                `Cannot decrease more than current stock (${currentStock} ${unit})`
            );
            return;
        }

        mutation.mutate(values);
    });

    // Handle tab change
    const handleTabChange = (value: string) => {
        form.setValue("type", value as "increase" | "decrease");

        // Set appropriate transaction type for the tab
        if (value === "increase") {
            form.setValue("transactionType", "purchase");
        } else {
            form.setValue("transactionType", "sale");
        }

        // Reset price fields when changing tabs
        form.setValue("purchasePrice", null);
        form.setValue("sellingPrice", null);
        form.setValue("totalPrice", null);
    };

    // Handle transaction type change
    const handleTransactionTypeChange = (value: TransactionType) => {
        form.setValue("transactionType", value);

        // Reset price fields when changing transaction type
        if (!needsPriceFields(value)) {
            form.setValue("purchasePrice", null);
            form.setValue("sellingPrice", null);
            form.setValue("totalPrice", null);
        }
    };

    // Handle quantity change
    const handleQuantityChange = (value: number) => {
        form.setValue("quantity", value);

        // Recalculate total price when quantity changes
        if (value > 0) {
            if (
                transactionType === "purchase" ||
                transactionType === "return"
            ) {
                const purchasePrice = form.getValues("purchasePrice");
                if (purchasePrice) {
                    form.setValue("totalPrice", purchasePrice * value);
                }
            } else if (
                transactionType === "sale" ||
                transactionType === "damaged" ||
                transactionType === "expired" ||
                transactionType === "loss"
            ) {
                const sellingPrice = form.getValues("sellingPrice");
                if (sellingPrice) {
                    form.setValue("totalPrice", sellingPrice * value);
                }
            }
        }
    };

    // Handle purchase price change
    const handlePurchasePriceChange = (value: number) => {
        form.setValue("purchasePrice", value);

        // Update total price when unit price changes
        if (quantity > 0) {
            form.setValue("totalPrice", value * quantity);
        }
    };

    // Handle selling price change
    const handleSellingPriceChange = (value: number) => {
        form.setValue("sellingPrice", value);

        // Update total price when unit price changes
        if (quantity > 0) {
            form.setValue("totalPrice", value * quantity);
        }
    };

    // Handle total price change
    const handleTotalPriceChange = (value: number) => {
        form.setValue("totalPrice", value);

        // Update unit price when total price changes
        if (quantity > 0) {
            if (
                transactionType === "purchase" ||
                transactionType === "return"
            ) {
                form.setValue("purchasePrice", value / quantity);
            } else if (
                transactionType === "sale" ||
                transactionType === "damaged" ||
                transactionType === "expired" ||
                transactionType === "loss"
            ) {
                form.setValue("sellingPrice", value / quantity);
            }
        }
    };

    return (
        <div className="space-y-2 text-sm max-w-4xl mx-auto">
            <FormHeader
                itemName={itemName}
                currentStock={currentStock}
                unit={unit}
            />

            {serverError && (
                <div className="bg-destructive/15 text-destructive p-2 rounded-lg text-sm font-medium border border-destructive/20 flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-5">
                    <AlertTriangle className="h-4 w-4" />
                    {serverError}
                </div>
            )}

            {showSuccess && (
                <div className="bg-green-50 text-green-700 p-2 rounded-lg text-sm font-medium border border-green-200 flex items-center gap-2 animate-in fade-in-50 slide-in-from-top-5">
                    <Check className="h-4 w-4" />
                    Stock adjustment successfully recorded!
                </div>
            )}

            <Tabs
                defaultValue={initialType}
                className="w-full"
                onValueChange={handleTabChange}
            >
                <TabsList className="grid grid-cols-2 mb-2 h-auto max-w-xs mx-auto">
                    <TabsTrigger
                        value="increase"
                        className="flex items-center gap-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Increase Stock</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="decrease"
                        className="flex items-center gap-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Minus className="h-4 w-4" />
                        <span>Decrease Stock</span>
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={onSubmit} className="space-y-2">
                    {/* Type and Date Selector Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                Transaction Type
                            </Label>
                            <TransactionTypeSelector
                                value={transactionType}
                                onChange={handleTransactionTypeChange}
                                stockActionType={stockActionType}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                Transaction Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "pl-3 text-left font-normal h-8 w-full text-sm bg-background",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        {date ? (
                                            format(date, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={form.getValues("date")}
                                        onSelect={(date) =>
                                            date && form.setValue("date", date)
                                        }
                                        disabled={(date) => {
                                            return (
                                                date > new Date() ||
                                                date < new Date("1900-01-01")
                                            );
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Transaction Details Card */}
                    <Card className="border-none shadow-sm bg-muted/40 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/5 to-primary/10 h-1"></div>
                        <CardContent className="p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="bg-primary/10 p-1 rounded-md">
                                    <Hash className="h-3.5 w-3.5" />
                                </div>
                                <h3 className="text-xs font-medium">
                                    Transaction Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Quantity and Reference */}
                                <div className="space-y-2">
                                    {/* Quantity Field */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">
                                            Quantity
                                        </Label>
                                        <div className="flex items-center">
                                            <Input
                                                type="number"
                                                className="h-8 text-sm bg-background"
                                                value={quantity || ""}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        Number.parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                min={0.01}
                                                step={0.01}
                                            />
                                            <Badge
                                                variant="outline"
                                                className="ml-2 px-2 py-1 bg-background"
                                            >
                                                {unit}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Reference Number */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">
                                            Reference{" "}
                                            {!showPriceFields && "(Optional)"}
                                        </Label>
                                        <Input
                                            value={
                                                form.getValues(
                                                    "referenceNumber"
                                                ) || ""
                                            }
                                            onChange={(e) =>
                                                form.setValue(
                                                    "referenceNumber",
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                showPriceFields
                                                    ? "Invoice/receipt #"
                                                    : "Optional reference"
                                            }
                                            className="h-8 text-sm bg-background"
                                        />
                                    </div>
                                </div>

                                {/* Price Fields */}
                                {showPriceFields ? (
                                    <div className="space-y-2">
                                        <div className="mb-1">
                                            <Label className="text-xs font-medium">
                                                Price Information
                                            </Label>
                                        </div>

                                        {(transactionType === "purchase" ||
                                            transactionType === "return") && (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">
                                                    {transactionType ===
                                                    "purchase"
                                                        ? "Purchase Price (per unit)"
                                                        : "Return Value (per unit)"}
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1.5 text-muted-foreground">
                                                        $
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        className="pl-6 h-8 text-sm bg-background"
                                                        value={
                                                            form.getValues(
                                                                "purchasePrice"
                                                            ) === null
                                                                ? ""
                                                                : (form.getValues(
                                                                      "purchasePrice"
                                                                  ) as number)
                                                        }
                                                        onChange={(e) =>
                                                            handlePurchasePriceChange(
                                                                Number.parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0
                                                            )
                                                        }
                                                        min={0}
                                                        step={0.01}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(transactionType === "sale" ||
                                            transactionType === "damaged" ||
                                            transactionType === "expired" ||
                                            transactionType === "loss") && (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium">
                                                    {transactionType === "sale"
                                                        ? "Selling Price (per unit)"
                                                        : "Item Value (per unit)"}
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1.5 text-muted-foreground">
                                                        $
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        className="pl-6 h-8 text-sm bg-background"
                                                        value={
                                                            form.getValues(
                                                                "sellingPrice"
                                                            ) === null
                                                                ? ""
                                                                : (form.getValues(
                                                                      "sellingPrice"
                                                                  ) as number)
                                                        }
                                                        onChange={(e) =>
                                                            handleSellingPriceChange(
                                                                Number.parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0
                                                            )
                                                        }
                                                        min={0}
                                                        step={0.01}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">
                                                Total Price
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1.5 text-muted-foreground">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 text-sm bg-background"
                                                    value={
                                                        form.getValues(
                                                            "totalPrice"
                                                        ) === null
                                                            ? ""
                                                            : (form.getValues(
                                                                  "totalPrice"
                                                              ) as number)
                                                    }
                                                    onChange={(e) =>
                                                        handleTotalPriceChange(
                                                            Number.parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    min={0}
                                                    step={0.01}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="bg-muted/80 rounded-full p-3 mx-auto mb-2">
                                                {stockActionType ===
                                                "increase" ? (
                                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <Minus className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                No pricing information required
                                                for{" "}
                                                {transactionType ===
                                                    "inventory-correction-add" ||
                                                transactionType ===
                                                    "inventory-correction-remove"
                                                    ? "inventory corrections"
                                                    : "this transaction type"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Section */}
                    <Card className="border-none shadow-sm bg-muted/40 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-300/30 to-blue-500/30 h-1"></div>
                        <CardContent className="p-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">
                                    Notes {!showPriceFields && "(Optional)"}
                                </Label>
                                <Textarea
                                    placeholder="Additional notes about this transaction"
                                    value={form.getValues("reason") || ""}
                                    onChange={(e) =>
                                        form.setValue("reason", e.target.value)
                                    }
                                    className="resize-none min-h-[40px] text-sm bg-background"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <SubmitButton
                        isSubmitting={mutation.isPending}
                        stockActionType={stockActionType}
                    />
                </form>
            </Tabs>
        </div>
    );
}
