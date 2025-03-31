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
    AlertTriangle as AlertTriangleIcon,
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
import { toast } from "sonner";

// --- Shadcn UI Form Imports ---
import { Form } from "@/components/ui/form";
// --- End Shadcn Form Imports ---

// UI Components used by main layout or actions
// Removed: import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";

// Sub-components
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
    onClose?: () => void;
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
        icon: <AlertTriangleIcon className="h-4 w-4" />,
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
    onClose,
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
    const totalPrice = form.watch("totalPrice");
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
        if (!showPriceFields || !quantity || quantity <= 0) {
            // If price fields aren't shown or quantity invalid, ensure total is nullified if not manually set
            if (!form.formState.dirtyFields.totalPrice)
                form.setValue("totalPrice", null);
            return;
        }

        const qty = Number(quantity);
        const price = isIncreaseType
            ? Number(purchasePrice ?? 0)
            : Number(sellingPrice ?? 0);

        // Only auto-calculate if total price wasn't manually entered AND price is valid
        if (!form.formState.dirtyFields.totalPrice && price > 0) {
            form.setValue("totalPrice", Number((qty * price).toFixed(2)), {
                shouldValidate: true,
            });
        }
    }, [
        quantity,
        purchasePrice,
        sellingPrice,
        isIncreaseType,
        showPriceFields,
        form,
    ]);

    // Handler for Quantity Change
    const handleQuantityChange = (qtyValue: string | number | undefined) => {
        // Convert empty string to a very small number that will fail validation
        // but still satisfy the type system
        const valueIsEmpty = qtyValue === "" || qtyValue === undefined;

        if (valueIsEmpty) {
            // Use 0 as fallback to satisfy type system, the validation will catch it as invalid
            form.setValue("quantity", 0, {
                shouldValidate: true,
                shouldDirty: true,
            });

            // Clear total price if not manually set
            if (!form.formState.dirtyFields.totalPrice) {
                form.setValue("totalPrice", null);
            }
            return;
        }

        // Parse the quantity
        const newQty = Number(qtyValue);

        // Set the form value
        form.setValue("quantity", newQty, {
            shouldValidate: true,
            shouldDirty: true,
        });

        if (newQty <= 0) {
            // If quantity becomes invalid, just clear the total if not manually set
            if (!form.formState.dirtyFields.totalPrice) {
                form.setValue("totalPrice", null);
            }
            return;
        }

        // If we have a unit price (purchase or selling), recalculate the total
        const unitPrice = isIncreaseType
            ? Number(purchasePrice ?? 0)
            : Number(sellingPrice ?? 0);

        if (unitPrice > 0) {
            // Update total based on new quantity and existing unit price
            form.setValue(
                "totalPrice",
                Number((newQty * unitPrice).toFixed(2)),
                {
                    shouldValidate: true,
                }
            );
        } else if (totalPrice) {
            // If we have a total but no unit price, calculate the unit price
            const calculatedUnitPrice = Number(
                (Number(totalPrice) / newQty).toFixed(2)
            );
            const priceField = isIncreaseType
                ? "purchasePrice"
                : "sellingPrice";

            form.setValue(priceField, calculatedUnitPrice, {
                shouldValidate: true,
            });
        }
    };

    // Handler for Total Price Change (adapt to use form.setValue)
    const handleTotalPriceChange = (value: string | number) => {
        const numValue = Number(value) || 0;
        form.setValue("totalPrice", numValue > 0 ? numValue : null, {
            shouldDirty: true,
            shouldValidate: true,
        });

        const qty = Number(quantity) || 0;
        if (qty > 0 && numValue >= 0) {
            const unitPrice = Number((numValue / qty).toFixed(2));
            const priceField = isIncreaseType
                ? "purchasePrice"
                : "sellingPrice";
            const otherPriceField = isIncreaseType
                ? "sellingPrice"
                : "purchasePrice";
            form.setValue(priceField, unitPrice > 0 ? unitPrice : null, {
                shouldValidate: true,
            });
            form.setValue(otherPriceField, null); // Clear the other price field
        }
    };

    // Handler for Unit Price Change
    const handleUnitPriceChange = (value: string | number) => {
        const numValue = Number(value) || 0;
        const priceField = isIncreaseType ? "purchasePrice" : "sellingPrice";

        form.setValue(priceField, numValue > 0 ? numValue : null, {
            shouldDirty: true,
            shouldValidate: true,
        });

        const qty = Number(quantity) || 0;
        if (qty > 0 && numValue > 0) {
            // Calculate and update total price
            form.setValue("totalPrice", Number((qty * numValue).toFixed(2)), {
                shouldValidate: true,
            });
        } else if (!numValue) {
            // If unit price cleared, clear total price too unless manually set
            if (!form.formState.dirtyFields.totalPrice) {
                form.setValue("totalPrice", null);
            }
        }
    };

    // Handler for Type Change (using setValue instead of reset)
    const handleTypeChange = (type: StockAdjustmentType) => {
        const newTransactionType = type === "increase" ? "purchase" : "sale";
        form.reset({
            // Reset preserves date and passed initialType
            ...form.getValues(), // Keep existing values like date
            type: type,
            transactionType: newTransactionType,
            quantity: undefined,
            purchasePrice: null,
            sellingPrice: null,
            totalPrice: null,
            referenceNumber: form.getValues("referenceNumber"), // Keep ref/reason if needed
            reason: form.getValues("reason"),
        });
        setServerError(null); // Clear errors on type change
    };

    // --- RHF Submit Handler ---
    const onSubmit = (values: StockAdjustmentFormValues) => {
        setServerError(null);
        if (values.type === "decrease" && values.quantity > currentStock) {
            form.setError("quantity", {
                type: "manual",
                message: `Cannot decrease more than current stock (${currentStock} ${unit})`,
            });
            return;
        }

        // Format data before sending
        const dataToSend = {
            ...values,
            quantity: Number(values.quantity || 0), // Ensure quantity is a number
            purchasePrice: values.purchasePrice
                ? Number(values.purchasePrice)
                : null,
            sellingPrice: values.sellingPrice
                ? Number(values.sellingPrice)
                : null,
            totalPrice: values.totalPrice ? Number(values.totalPrice) : null,
            date: values.date ?? new Date(), // Ensure date is set
        };
        mutation.mutate(dataToSend);
    };
    // --- End RHF Submit Handler ---

    const mutation = useMutation({
        mutationFn: (values: StockAdjustmentFormValues) =>
            adjustInventoryItemStock(itemId, values),
        onSuccess: (data) => {
            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({
                queryKey: ["stockTransactions", itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });

            setShowSuccess(true);
            form.reset(); // Reset form on success
            toast.success(data.message || "Stock adjusted successfully!"); // Use API message
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess?.();
            }, 1500); // Slightly faster close
        },
        onError: (error) => {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            setServerError(errorMsg);
            toast.error(`Error: ${errorMsg}`);
        },
    });

    return (
        <TooltipProvider>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    {/* Integrated Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-1 mb-4">
                        <h2 className="text-lg font-semibold truncate">
                            Adjust Stock:{" "}
                            <span className="text-primary">{itemName}</span>
                        </h2>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground shrink-0">
                            <span>Current Stock:</span>
                            <Badge variant="secondary" className="text-base">
                                {currentStock} {unit}
                            </Badge>
                        </div>
                    </div>

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
                        currentStock={currentStock}
                        isIncreaseType={isIncreaseType}
                        showPriceFields={showPriceFields}
                        relevantTransactionTypes={relevantTransactionTypes}
                        handleTotalPriceChange={handleTotalPriceChange}
                        handleQuantityChange={handleQuantityChange}
                        handleUnitPriceChange={handleUnitPriceChange}
                        transactionTypesConfig={TRANSACTION_TYPES}
                    />

                    <Separator className="my-6" />

                    <StockAdjustmentActions
                        isSubmitting={form.formState.isSubmitting}
                        isPending={mutation.isPending}
                        isIncreaseType={isIncreaseType}
                        onClose={onClose}
                    />
                </form>
            </Form>
        </TooltipProvider>
    );
}
