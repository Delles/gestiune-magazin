"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { PencilIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateItemReorderPoint } from "../../_data/api";
import { toast } from "sonner";
import AdjustReorderPointPopoverContent from "./AdjustReorderPointPopoverContent";

// Placeholder for the visual component - replace with actual implementation later
const StockQuantityVisual = ({
    quantity,
    reorderPoint,
}: {
    quantity: number;
    reorderPoint: number | null;
}) => {
    // Basic visual representation - enhance later
    const isLow =
        reorderPoint !== null && quantity <= reorderPoint && quantity > 0;
    const isOut = quantity <= 0;
    const indicatorColor = isOut
        ? "bg-destructive"
        : isLow
        ? "bg-warning"
        : "bg-success";

    return (
        <div className="flex flex-col items-center">
            <div
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mb-2",
                    indicatorColor
                )}
                title={
                    isOut
                        ? "Out of Stock"
                        : isLow
                        ? `Low Stock (Reorder at ${reorderPoint ?? "N/A"})`
                        : `In Stock (${quantity})`
                }
            >
                {quantity}
            </div>
            <span className="text-xs text-muted-foreground">
                {isOut ? "Out" : isLow ? "Low" : "In Stock"}
            </span>
        </div>
    );
};

// Explicit props interface for MetricDisplayCard
interface MetricDisplayCardProps {
    title: string;
    value: string | number;
    description?: string;
    footer?: React.ReactNode;
    children?: React.ReactNode;
}

// Helper component for consistent metric display using React.FC
const MetricDisplayCard: React.FC<MetricDisplayCardProps> = ({
    title,
    value,
    description,
    footer,
    children,
}) => (
    <div className="border rounded-lg p-4 flex flex-col justify-between bg-muted/40 h-full min-h-[100px]">
        <div>
            <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                    {title}
                </p>
                {children}
            </div>
            <p className="text-xl font-semibold truncate">{value}</p>
            {description && (
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            )}
        </div>
        {footer && <div className="mt-2">{footer}</div>}
    </div>
);

interface PrimaryMetricsProps {
    itemId: string;
    stock_quantity: number;
    reorder_point: number | null;
    unit: string;
    selling_price: number | null;
    average_purchase_price: number | null;
    last_purchase_price: number | null;
    className?: string;
}

export function PrimaryMetrics({
    itemId,
    stock_quantity,
    reorder_point,
    unit,
    selling_price,
    average_purchase_price,
    last_purchase_price,
    className,
}: PrimaryMetricsProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            reorder_point,
        }: {
            id: string;
            reorder_point: number | null;
        }) => updateItemReorderPoint(id, reorder_point),
        onSuccess: (_data) => {
            toast.success("Reorder point updated successfully.");
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ["stockTransactions", itemId],
            });
            setIsPopoverOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to update reorder point: ${error.message}`);
        },
    });

    const handleSaveReorderPoint = (data: { reorder_point: number | null }) => {
        mutation.mutate({ id: itemId, reorder_point: data.reorder_point });
    };

    const estimatedStockValue = stock_quantity * (average_purchase_price ?? 0);
    const estimatedProfitMargin =
        selling_price && average_purchase_price && selling_price !== 0
            ? ((selling_price - average_purchase_price) / selling_price) * 100
            : 0;

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // TODO: Make currency dynamic if needed
        }).format(value);
    };

    const formatPercentage = (value: number | null) => {
        if (value === null || value === undefined) return "N/A";
        return `${value.toFixed(1)}%`;
    };

    const formatNullableNumber = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return value;
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Primary Metrics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                    {/* Stock Visual & Quantity */}
                    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/40">
                        <StockQuantityVisual
                            quantity={stock_quantity}
                            reorderPoint={reorder_point}
                        />
                        <div className="text-center">
                            <p className="text-sm font-medium">Current Stock</p>
                            <p className="text-xl font-semibold">
                                {stock_quantity}
                                <span className="text-sm text-muted-foreground ml-1">
                                    {unit}(s)
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricDisplayCard
                            title="Reorder Point"
                            value={`${formatNullableNumber(reorder_point)} ${
                                reorder_point !== null ? unit + "(s)" : ""
                            }`}
                            description="Stock level to trigger reorder"
                        >
                            <Popover
                                open={isPopoverOpen}
                                onOpenChange={setIsPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-auto self-start -mr-2 -mt-1 text-muted-foreground hover:text-primary"
                                        aria-label="Edit reorder point"
                                        disabled={mutation.isPending}
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-60 p-0">
                                    {isPopoverOpen && (
                                        <AdjustReorderPointPopoverContent
                                            initialValue={reorder_point}
                                            unit={unit}
                                            onSave={handleSaveReorderPoint}
                                            onCancel={() =>
                                                setIsPopoverOpen(false)
                                            }
                                            isLoading={mutation.isPending}
                                        />
                                    )}
                                </PopoverContent>
                            </Popover>
                        </MetricDisplayCard>
                        <MetricDisplayCard
                            title="Selling Price"
                            value={formatCurrency(selling_price)}
                            description="Price per unit"
                        />
                        <MetricDisplayCard
                            title="Avg. Purchase Cost"
                            value={formatCurrency(average_purchase_price)}
                            description="Average cost per unit"
                        />
                        <MetricDisplayCard
                            title="Last Purchase Cost"
                            value={formatCurrency(last_purchase_price)}
                            description="Cost on last restock"
                        />
                        <MetricDisplayCard
                            title="Est. Stock Value"
                            value={formatCurrency(estimatedStockValue)}
                            description="Avg. Cost * Quantity"
                        />
                        <MetricDisplayCard
                            title="Est. Profit Margin"
                            value={formatPercentage(estimatedProfitMargin)}
                            description="Per unit sold"
                        />
                        <div className="border rounded-lg p-4 flex flex-col justify-center items-center bg-muted/20 h-full min-h-[100px]">
                            <span className="text-muted-foreground text-sm">
                                (Future Metric)
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
