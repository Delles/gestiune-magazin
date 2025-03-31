// src/app/(authenticated)/inventory/_components/stock-adjustment/components/StockAdjustmentFields.tsx
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    DollarSign,
    Hash,
    FileText,
    Type,
    Warehouse,
    Info,
    AlertCircle,
} from "lucide-react";
import {
    type StockAdjustmentFormValues,
    type TransactionType,
} from "@/lib/validation/inventory-schemas"; // Adjust import if needed
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Assuming TRANSACTION_TYPES structure - define a type for it
type TransactionTypeConfig = {
    [key in TransactionType]: {
        label: string;
        description: string;
        icon: React.ReactNode;
        requiresPrice: boolean;
    };
};

interface StockAdjustmentFieldsProps {
    unit: string;
    currentStock: number;
    isIncreaseType: boolean;
    showPriceFields: boolean;
    relevantTransactionTypes: TransactionType[];
    handleTotalPriceChange: (value: string | number) => void;
    handleQuantityChange: (value: string | number | undefined) => void;
    handleUnitPriceChange: (value: string | number) => void;
    form: UseFormReturn<StockAdjustmentFormValues>;
    transactionTypesConfig: TransactionTypeConfig;
}

export function StockAdjustmentFields({
    unit,
    currentStock,
    isIncreaseType,
    showPriceFields,
    relevantTransactionTypes,
    handleTotalPriceChange,
    handleQuantityChange,
    handleUnitPriceChange,
    form,
    transactionTypesConfig,
}: StockAdjustmentFieldsProps) {
    const { control, setValue, watch } = form;
    const selectedTransactionType = watch("transactionType");
    const quantity = watch("quantity");
    const totalPrice = watch("totalPrice");
    const unitPrice = watch(isIncreaseType ? "purchasePrice" : "sellingPrice");

    const getSellingPriceLabel = () =>
        selectedTransactionType === "sale"
            ? "Selling Price (per unit)"
            : "Item Value (per unit)";

    const isDecreaseQuantityInvalid =
        !isIncreaseType && quantity && quantity > currentStock;

    // Determine if price fields should be disabled (no quantity entered)
    const isPriceFieldsDisabled = !quantity || quantity <= 0;

    // Check if prices have been entered
    const hasPriceData = totalPrice || unitPrice;

    return (
        <div className="space-y-6">
            {/* Section 1: Core Transaction Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Transaction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                    <FormField
                        control={control}
                        name="transactionType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center">
                                    <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Type
                                </FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        if (value) {
                                            field.onChange(value);
                                            setValue("purchasePrice", null);
                                            setValue("sellingPrice", null);
                                            setValue("totalPrice", null);
                                        }
                                    }}
                                    value={
                                        field.value ||
                                        (isIncreaseType ? "purchase" : "sale")
                                    }
                                    defaultValue={
                                        field.value ||
                                        (isIncreaseType ? "purchase" : "sale")
                                    }
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {relevantTransactionTypes.map(
                                            (type) => (
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                >
                                                    <div className="flex items-center">
                                                        {
                                                            transactionTypesConfig[
                                                                type
                                                            ]?.icon
                                                        }
                                                        <span className="ml-2">
                                                            {
                                                                transactionTypesConfig[
                                                                    type
                                                                ]?.label
                                                            }
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                                {field.value &&
                                    transactionTypesConfig[field.value] && (
                                        <FormDescription className="text-xs">
                                            {
                                                transactionTypesConfig[
                                                    field.value
                                                ].description
                                            }
                                        </FormDescription>
                                    )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center mb-1.5">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Date
                                </FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal bg-background",
                                                    !field.value &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) =>
                                                field.onChange(
                                                    date ?? new Date()
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
                    <FormField
                        control={control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center">
                                    <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Quantity
                                </FormLabel>
                                <div className="flex">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            step="any"
                                            min="0.01"
                                            placeholder="0.00"
                                            className={cn(
                                                "rounded-r-none bg-background",
                                                isDecreaseQuantityInvalid &&
                                                    "border-destructive focus-visible:ring-destructive/50"
                                            )}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                handleQuantityChange(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />
                                    </FormControl>
                                    <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted/50 text-muted-foreground text-sm">
                                        {unit}
                                    </div>
                                </div>
                                {!isIncreaseType && (
                                    <FormDescription className="text-xs">
                                        Current stock: {currentStock} {unit}
                                    </FormDescription>
                                )}
                                {hasPriceData && (
                                    <FormDescription className="text-xs flex items-center mt-1 text-amber-500 dark:text-amber-400">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Changing quantity will update the total
                                        price calculation
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Section 2: Pricing (Conditional) */}
            {showPriceFields && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Pricing / Value
                    </h3>
                    <div className="p-4 rounded-md bg-muted/30 border space-y-4">
                        {isPriceFieldsDisabled && (
                            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start mb-3">
                                <AlertCircle className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0" />
                                <span>
                                    Please enter a quantity above to enable
                                    price fields
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                            {/* Unit Price (Purchase or Selling) */}
                            <FormField
                                control={control}
                                name={
                                    isIncreaseType
                                        ? "purchasePrice"
                                        : "sellingPrice"
                                }
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {isIncreaseType
                                                ? "Purchase Price (per unit)"
                                                : getSellingPriceLabel()}
                                        </FormLabel>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="pl-8 bg-background"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        handleUnitPriceChange(
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        isPriceFieldsDisabled
                                                    }
                                                />
                                            </FormControl>
                                        </div>
                                        {totalPrice && (
                                            <FormDescription className="text-xs flex items-center mt-1">
                                                <Info className="h-3 w-3 mr-1" />
                                                Changing unit price will update
                                                total
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Total Price */}
                            <FormField
                                control={control}
                                name="totalPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <TooltipProvider
                                                delayDuration={100}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger className="flex items-center cursor-help">
                                                        Total Price / Value{" "}
                                                        <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        className="max-w-xs text-xs p-2"
                                                    >
                                                        Enter total amount or
                                                        unit price. Entering one
                                                        will auto-calculate the
                                                        other if quantity is
                                                        set. Manually entering
                                                        total overrides
                                                        auto-calculation.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </FormLabel>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="pl-8 bg-background"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                        handleTotalPriceChange(
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={field.onBlur}
                                                    disabled={
                                                        isPriceFieldsDisabled
                                                    }
                                                />
                                            </FormControl>
                                        </div>
                                        {unitPrice && (
                                            <FormDescription className="text-xs flex items-center mt-1">
                                                <Info className="h-3 w-3 mr-1" />
                                                Changing total will update unit
                                                price
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Section 3: Additional Info (Optional) */}
            <div className="space-y-4 pt-4 border-t border-dashed">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                    <FormField
                        control={control}
                        name="referenceNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center">
                                    <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Reference # (Optional)
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., PO-123, INV-456"
                                        className="bg-background"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                Reason / Notes (Optional)
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Add any relevant details..."
                                    className="bg-background min-h-[80px]"
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
    );
}
