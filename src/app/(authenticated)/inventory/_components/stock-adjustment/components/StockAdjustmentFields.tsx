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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarIcon, DollarSign, Hash } from "lucide-react";
import {
    type StockAdjustmentFormValues,
    type TransactionType,
} from "@/lib/validation/inventory-schemas"; // Adjust import if needed

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
    isIncreaseType: boolean;
    showPriceFields: boolean;
    relevantTransactionTypes: TransactionType[];
    handleTotalPriceChange: (value: string | number) => void;
    form: UseFormReturn<StockAdjustmentFormValues>;
    transactionTypesConfig: TransactionTypeConfig;
}

export function StockAdjustmentFields({
    unit,
    isIncreaseType,
    showPriceFields,
    relevantTransactionTypes,
    handleTotalPriceChange,
    form,
    transactionTypesConfig,
}: StockAdjustmentFieldsProps) {
    const { control, setValue } = form;
    const selectedTransactionType = form.watch("transactionType");

    // Get appropriate label for selling price field
    const getSellingPriceLabel = () => {
        if (selectedTransactionType === "sale") {
            return "Selling Price (per unit)";
        } else {
            return "Item Value (per unit)";
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="transactionType"
                        render={({ field }) => (
                            <FormItem className="min-h-[110px]">
                                <FormLabel>Transaction Type</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        // Ensure we're using a valid transaction type
                                        if (value && value !== "") {
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
                                        <FormDescription>
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
                            <FormItem className="flex flex-col pt-2 min-h-[110px]">
                                <FormLabel>Date</FormLabel>
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
                                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                </CardContent>
            </Card>

            <Card className="bg-muted/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Transaction Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem className="min-h-[90px]">
                                    <FormLabel>Quantity</FormLabel>
                                    <div className="flex">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="any"
                                                min="0.01"
                                                placeholder="0.00"
                                                className="rounded-r-none bg-background"
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(
                                                        val === ""
                                                            ? undefined
                                                            : Number(val)
                                                    );
                                                }}
                                                required
                                            />
                                        </FormControl>
                                        <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted/50 text-muted-foreground text-sm">
                                            {unit}
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showPriceFields && isIncreaseType && (
                            <FormField
                                control={control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem className="min-h-[90px]">
                                        <FormLabel>
                                            Purchase Price (per unit)
                                        </FormLabel>
                                        <div className="flex">
                                            <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted/50 text-muted-foreground text-sm">
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="rounded-l-none bg-background"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        field.onChange(
                                                            val === ""
                                                                ? null
                                                                : Number(val)
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {showPriceFields && !isIncreaseType && (
                            <FormField
                                control={control}
                                name="sellingPrice"
                                render={({ field }) => (
                                    <FormItem className="min-h-[90px]">
                                        <FormLabel>
                                            {getSellingPriceLabel()}
                                        </FormLabel>
                                        <div className="flex">
                                            <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted/50 text-muted-foreground text-sm">
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="rounded-l-none bg-background"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        field.onChange(
                                                            val === ""
                                                                ? null
                                                                : Number(val)
                                                        );
                                                    }}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {showPriceFields && (
                        <FormField
                            control={control}
                            name="totalPrice"
                            render={({ field }) => (
                                <FormItem className="min-h-[90px]">
                                    <FormLabel>Total Price / Value</FormLabel>
                                    <div className="flex">
                                        <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted/50 text-muted-foreground text-sm">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="0.00"
                                                className="rounded-l-none bg-background"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    handleTotalPriceChange(
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={field.onBlur}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                        Additional Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="referenceNumber"
                            render={({ field }) => (
                                <FormItem className="min-h-[90px]">
                                    <FormLabel>
                                        Reference # (Optional)
                                    </FormLabel>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="e.g., PO-123, INV-456"
                                                className="pl-8 bg-background"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value || ""
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem className="min-h-[90px]">
                                <FormLabel>Reason / Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Add any relevant notes or details..."
                                        className="bg-background min-h-[80px]"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value || "")
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
