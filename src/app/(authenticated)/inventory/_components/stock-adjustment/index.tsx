"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// --- React Hook Form Imports ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// --- End RHF Imports ---
import {
    Plus,
    Minus,
    ShoppingCart,
    PackageCheck,
    Store,
    PackageX,
    AlertTriangle,
    AlertCircle,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    stockAdjustmentSchema,
    type TransactionType,
    type StockAdjustmentFormValues,
} from "@/lib/validation/inventory-schemas";
import { adjustInventoryItemStock } from "@/services/inventoryService";

// --- Shadcn UI Form Imports ---
import { Form } from "@/components/ui/form";
// --- End Shadcn Form Imports ---

// UI Components used by main layout or actions
// Removed: import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Removed: import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";

// Sub-components
import { StockAdjustmentHeader } from "./components/StockAdjustmentHeader";
import { FeedbackMessages } from "./components/FeedbackMessages";
import { StockAdjustmentTypeTabs } from "./components/StockAdjustmentTypeTabs";
import { StockAdjustmentFields } from "./components/StockAdjustmentFields";
import { StockAdjustmentActions } from "./components/StockAdjustmentActions";

// Types and Constants
export type StockAdjustmentType = "increase" | "decrease";

interface StockAdjustmentFormProps {
    itemId: string;
    itemName: string;
    unit: string;
    currentStock: number;
    onSuccess?: () => void;
    initialType?: StockAdjustmentType;
}

interface TransactionTypeConfig {
    label: string;
    icon: React.ReactNode;
    description: string;
    requiresPrice: boolean;
}

// Transaction Type Configurations
const TRANSACTION_TYPES: Record<TransactionType, TransactionTypeConfig> = {
    // Increase types
    purchase: {
        label: "Purchase",
        icon: <ShoppingCart className="h-4 w-4" />,
        description: "Receive new stock from supplier",
        requiresPrice: true,
    },
    return: {
        label: "Customer Return",
        icon: <PackageCheck className="h-4 w-4" />,
        description: "Stock returned by customers",
        requiresPrice: true, // Often requires a value, even if refund
    },
    "inventory-correction-add": {
        label: "Inventory Correction (Add)",
        icon: <Plus className="h-4 w-4" />,
        description: "Correct inventory count (add stock)",
        requiresPrice: false,
    },
    "other-addition": {
        label: "Other Addition",
        icon: <ArrowUp className="h-4 w-4" />,
        description: "Other stock increase reasons",
        requiresPrice: false,
    },
    // Decrease types
    sale: {
        label: "Manual Sale",
        icon: <Store className="h-4 w-4" />,
        description: "Record a manual sale",
        requiresPrice: true,
    },
    damaged: {
        label: "Damaged Goods",
        icon: <PackageX className="h-4 w-4" />,
        description: "Stock damaged and no longer usable",
        requiresPrice: true, // Value of the damaged goods
    },
    loss: {
        label: "Loss",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Stock lost or stolen",
        requiresPrice: true, // Value of the lost goods
    },
    expired: {
        label: "Expired",
        icon: <AlertCircle className="h-4 w-4" />,
        description: "Stock expired and no longer usable",
        requiresPrice: true, // Value of the expired goods
    },
    "inventory-correction-remove": {
        label: "Inventory Correction (Remove)",
        icon: <Minus className="h-4 w-4" />,
        description: "Correct inventory count (remove stock)",
        requiresPrice: false,
    },
    "other-removal": {
        label: "Other Removal",
        icon: <ArrowDown className="h-4 w-4" />,
        description: "Other stock decrease reasons",
        requiresPrice: false,
    },
};

// Main Component
export default function StockAdjustmentForm({
    itemId,
    itemName,
    unit,
    currentStock,
    onSuccess,
    initialType = "increase",
}: StockAdjustmentFormProps) {
    const queryClient = useQueryClient();

    // --- React Hook Form Setup ---
    const form = useForm<StockAdjustmentFormValues>({
        resolver: zodResolver(stockAdjustmentSchema),
        defaultValues: {
            type: initialType,
            transactionType: initialType === "increase" ? "purchase" : "sale",
            quantity: undefined, // RHF handles undefined better
            purchasePrice: null,
            sellingPrice: null,
            totalPrice: null,
            referenceNumber: "", // Use empty string for optional text
            reason: "", // Use empty string for optional text
            date: new Date(),
        },
        mode: "onChange", // Validate on change
    });
    // --- End RHF Setup ---

    const [serverError, setServerError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // --- Get values for conditional rendering/logic using RHF's watch ---
    const selectedType = form.watch("type");
    const selectedTransactionType = form.watch("transactionType");
    const quantity = form.watch("quantity");
    const purchasePrice = form.watch("purchasePrice");
    const sellingPrice = form.watch("sellingPrice");
    // --- End RHF watch ---

    const isIncreaseType = selectedType === "increase";
    const relevantTransactionTypes = useMemo(() => {
        return isIncreaseType
            ? Object.entries(TRANSACTION_TYPES)
                  .filter(([key]) =>
                      [
                          "purchase",
                          "return",
                          "inventory-correction-add",
                          "other-addition",
                      ].includes(key)
                  )
                  .map(([key]) => key as TransactionType)
            : Object.entries(TRANSACTION_TYPES)
                  .filter(([key]) =>
                      [
                          "sale",
                          "damaged",
                          "loss",
                          "expired",
                          "inventory-correction-remove",
                          "other-removal",
                      ].includes(key)
                  )
                  .map(([key]) => key as TransactionType);
    }, [isIncreaseType]);

    const showPriceFields = useMemo(() => {
        return selectedTransactionType
            ? TRANSACTION_TYPES[selectedTransactionType].requiresPrice
            : false;
    }, [selectedTransactionType]);

    // Effect for Total Price Calculation (adapt to use form.setValue)
    useEffect(() => {
        if (!showPriceFields) return;

        const qty = Number(quantity) || 0;
        if (qty <= 0) return;

        const isTotalPriceManuallySet = form.formState.dirtyFields.totalPrice;

        if (isIncreaseType) {
            const price = Number(purchasePrice) || 0;
            if (price > 0 && !isTotalPriceManuallySet) {
                form.setValue(
                    "totalPrice",
                    Number((qty * price).toFixed(2)),
                    { shouldValidate: true } // Optionally validate after setting
                );
            }
        } else {
            const price = Number(sellingPrice) || 0;
            if (price > 0 && !isTotalPriceManuallySet) {
                form.setValue("totalPrice", Number((qty * price).toFixed(2)), {
                    shouldValidate: true,
                });
            }
        }
    }, [
        quantity,
        purchasePrice,
        sellingPrice,
        isIncreaseType,
        showPriceFields,
        form,
    ]);

    // Handler for Total Price Change (adapt to use form.setValue)
    const handleTotalPriceChange = (value: string | number) => {
        const numValue = Number(value) || 0;
        // Set total price first, mark as dirty
        form.setValue("totalPrice", numValue, {
            shouldDirty: true,
            shouldValidate: true,
        });

        const qty = Number(quantity) || 0;
        if (qty > 0 && numValue >= 0) {
            const unitPrice = Number((numValue / qty).toFixed(2));
            if (isIncreaseType) {
                form.setValue("purchasePrice", unitPrice, {
                    shouldValidate: true,
                });
            } else {
                form.setValue("sellingPrice", unitPrice, {
                    shouldValidate: true,
                });
            }
        }
    };

    // Handler for Type Change (using setValue instead of reset)
    const handleTypeChange = (type: StockAdjustmentType) => {
        const newTransactionType = type === "increase" ? "purchase" : "sale";

        // Set values individually
        form.setValue("type", type);
        form.setValue("transactionType", newTransactionType);
        // Reset and clear values that depend on type/transaction type
        form.setValue("quantity", 0);
        form.setValue("purchasePrice", null);
        form.setValue("sellingPrice", null);
        form.setValue("totalPrice", null);

        // Re-validate the form after changing values
        form.trigger();

        // Clear any previous server errors
        setServerError(null);
    };

    // --- RHF Submit Handler ---
    const onSubmit = (values: StockAdjustmentFormValues) => {
        setServerError(null);
        // Manual validation (already done by resolver, but good for extra checks)
        if (values.type === "decrease" && values.quantity > currentStock) {
            form.setError("quantity", {
                type: "manual",
                message: `Cannot decrease more than current stock (${currentStock} ${unit})`,
            });
            return;
        }
        mutation.mutate(values);
    };
    // --- End RHF Submit Handler ---

    const mutation = useMutation({
        mutationFn: (values: StockAdjustmentFormValues) =>
            adjustInventoryItemStock(itemId, values),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId, "transactions"],
            });
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            setShowSuccess(true);
            form.reset(); // Reset form on success
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess?.();
            }, 2000);
            console.log("Stock adjustment success:", data);
        },
        onError: (error) => {
            setServerError(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"
            );
        },
    });

    return (
        <TooltipProvider>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <StockAdjustmentHeader
                        itemName={itemName}
                        currentStock={currentStock}
                        unit={unit}
                    />

                    <FeedbackMessages
                        serverError={serverError}
                        showSuccess={showSuccess}
                    />

                    <StockAdjustmentTypeTabs
                        selectedType={selectedType}
                        onTypeChange={handleTypeChange}
                    />

                    <StockAdjustmentFields
                        form={form}
                        unit={unit}
                        isIncreaseType={isIncreaseType}
                        showPriceFields={showPriceFields}
                        relevantTransactionTypes={relevantTransactionTypes}
                        handleTotalPriceChange={handleTotalPriceChange}
                        transactionTypesConfig={TRANSACTION_TYPES}
                    />

                    <Separator className="my-6" />

                    <StockAdjustmentActions
                        isSubmitting={form.formState.isSubmitting}
                        isPending={mutation.isPending}
                        isIncreaseType={isIncreaseType}
                    />
                </form>
            </Form>
        </TooltipProvider>
    );
}
