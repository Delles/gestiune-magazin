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
import {
    PencilIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon,
    PlusIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateItemReorderPoint } from "../../_data/api";
import { toast } from "sonner";
import AdjustReorderPointPopoverContent from "./AdjustReorderPointPopoverContent";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import IncreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/IncreaseStockForm";
import DecreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/DecreaseStockForm";

// Explicit props interface for MetricDisplayCard
interface MetricDisplayCardProps {
    title: string;
    value: string | number | React.ReactNode;
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
    itemName: string;
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
    itemName,
    stock_quantity,
    reorder_point,
    unit,
    selling_price,
    average_purchase_price,
    last_purchase_price,
    className,
}: PrimaryMetricsProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddStockOpen, setIsAddStockOpen] = useState(false);
    const [isReduceStockOpen, setIsReduceStockOpen] = useState(false);
    const queryClient = useQueryClient();

    // Prevent popovers from closing when clicking outside
    const handlePopoverOpenChange = (
        open: boolean,
        setter: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        if (open) {
            setter(true);
        }
        // When trying to close, we don't set to false
        // This way only our explicit handlers can close the popover
    };

    const mutation = useMutation({
        mutationFn: ({
            id,
            reorder_point,
        }: {
            id: string;
            reorder_point: number | null;
        }) => updateItemReorderPoint(id, reorder_point),
        onSuccess: () => {
            toast.success(
                "Punctul de reaprovizionare a fost actualizat cu succes."
            );
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ["stockTransactions", itemId],
            });
            setIsPopoverOpen(false);
        },
        onError: (error) => {
            toast.error(
                `Actualizarea punctului de reaprovizionare a eșuat: ${error.message}`
            );
        },
    });

    const handleSaveReorderPoint = (data: { reorder_point: number | null }) => {
        mutation.mutate({ id: itemId, reorder_point: data.reorder_point });
    };

    // Function to handle successful stock adjustment
    const handleStockAdjustmentSuccess = () => {
        // Close both popovers
        setIsAddStockOpen(false);
        setIsReduceStockOpen(false);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
            queryKey: ["inventoryItem", itemId],
        });
        queryClient.invalidateQueries({
            queryKey: ["stockTransactions", itemId],
        });
    };

    // Determine stock status for the new stock visual
    const isLowStock =
        reorder_point !== null &&
        stock_quantity <= reorder_point &&
        stock_quantity > 0;
    const isOutOfStock = stock_quantity <= 0;
    const indicatorColor = isOutOfStock
        ? "bg-destructive"
        : isLowStock
        ? "bg-yellow-500"
        : "bg-emerald-500";
    const statusText = isOutOfStock
        ? "Stoc epuizat"
        : isLowStock
        ? "Stoc scăzut"
        : "În stoc";

    const estimatedStockValue = stock_quantity * (average_purchase_price ?? 0);
    const estimatedProfitMargin =
        selling_price && average_purchase_price && selling_price !== 0
            ? ((selling_price - average_purchase_price) / selling_price) * 100
            : 0;

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
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

    // --- Calculate Trend --- START
    let trendIndicator: React.ReactNode = null;
    if (
        last_purchase_price !== null &&
        average_purchase_price !== null &&
        average_purchase_price !== 0 // Avoid division by zero and meaningless comparison
    ) {
        const difference = last_purchase_price - average_purchase_price;
        const percentageDifference =
            (difference / average_purchase_price) * 100;

        let TrendIcon = MinusIcon;
        let colorClass = "bg-muted text-muted-foreground"; // Neutral
        let text = "Stabil";

        if (percentageDifference > 1) {
            // Consider >1% as increase
            TrendIcon = ArrowUpIcon;
            colorClass = "bg-destructive/10 text-destructive"; // Red for cost increase (price went up - bad)
            text = `${percentageDifference.toFixed(1)}% mai mare`;
        } else if (percentageDifference < -1) {
            // Consider <-1% as decrease
            TrendIcon = ArrowDownIcon;
            colorClass = "bg-green-500/10 text-green-600"; // Green for cost decrease (price went down - good)
            text = `${Math.abs(percentageDifference).toFixed(1)}% mai mic`;
        }

        trendIndicator = (
            <Badge
                variant="outline"
                className={cn("text-xs font-normal py-0.5 px-1.5", colorClass)}
            >
                <TrendIcon className="h-3 w-3 mr-1" />
                {text}
            </Badge>
        );
    }
    // --- Calculate Trend --- END

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Indicatori Primari</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                    {/* New Stock Visual & Quantity with +/- Buttons */}
                    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/40">
                        {/* Colored Circle Stock Indicator */}
                        <div
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg",
                                indicatorColor
                            )}
                        >
                            {stock_quantity}
                        </div>

                        <div className="text-center">
                            <span className="text-xs text-muted-foreground">
                                {statusText}
                            </span>
                            <p className="text-sm text-muted-foreground">
                                {unit}(s)
                            </p>
                        </div>

                        {/* Stock Adjustment Buttons with Popovers */}
                        <div className="flex gap-2 mt-2">
                            {/* Decrease Stock Button/Popover */}
                            <Popover
                                open={isReduceStockOpen}
                                onOpenChange={(open) =>
                                    handlePopoverOpenChange(
                                        open,
                                        setIsReduceStockOpen
                                    )
                                }
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={
                                                        stock_quantity <= 0
                                                    }
                                                >
                                                    <MinusIcon className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Redu stocul</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent
                                    className="w-80"
                                    side="bottom"
                                    align="center"
                                >
                                    <DecreaseStockForm
                                        itemId={itemId}
                                        itemName={itemName}
                                        unit={unit}
                                        currentStock={stock_quantity}
                                        averagePurchasePrice={
                                            average_purchase_price
                                        }
                                        onSuccess={handleStockAdjustmentSuccess}
                                        onClose={() =>
                                            setIsReduceStockOpen(false)
                                        }
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Increase Stock Button/Popover */}
                            <Popover
                                open={isAddStockOpen}
                                onOpenChange={(open) =>
                                    handlePopoverOpenChange(
                                        open,
                                        setIsAddStockOpen
                                    )
                                }
                            >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Adaugă stoc</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <PopoverContent
                                    className="w-80"
                                    side="bottom"
                                    align="center"
                                >
                                    <IncreaseStockForm
                                        itemId={itemId}
                                        itemName={itemName}
                                        unit={unit}
                                        currentStock={stock_quantity}
                                        onSuccess={handleStockAdjustmentSuccess}
                                        onClose={() => setIsAddStockOpen(false)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricDisplayCard
                            title="Punct de reaprovizionare"
                            value={`${formatNullableNumber(reorder_point)} ${
                                reorder_point !== null ? unit + "(s)" : ""
                            }`}
                            description="Nivelul stocului pentru a declanșa reaprovizionarea"
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
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
                                                    disabled={
                                                        mutation.isPending
                                                    }
                                                >
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-60 p-0">
                                                {isPopoverOpen && (
                                                    <AdjustReorderPointPopoverContent
                                                        initialValue={
                                                            reorder_point
                                                        }
                                                        unit={unit}
                                                        onSave={
                                                            handleSaveReorderPoint
                                                        }
                                                        onCancel={() =>
                                                            setIsPopoverOpen(
                                                                false
                                                            )
                                                        }
                                                        isLoading={
                                                            mutation.isPending
                                                        }
                                                    />
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Editează punctul de reaprovizionare
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </MetricDisplayCard>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <MetricDisplayCard
                                            title="Preț de vânzare"
                                            value={formatCurrency(
                                                selling_price
                                            )}
                                            description="Prețul per unitate"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Prețul la care se vinde acest articol</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <MetricDisplayCard
                                            title="Cost mediu de achiziție"
                                            value={formatCurrency(
                                                average_purchase_price
                                            )}
                                            description="Costul mediu per unitate"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Costul mediu de achiziție al acestui
                                        articol
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <MetricDisplayCard
                                            title="Ultimul cost de achiziție"
                                            value={formatCurrency(
                                                last_purchase_price
                                            )}
                                            description="Cel mai recent cost per unitate"
                                            footer={trendIndicator}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Costul ultimei achiziții</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <MetricDisplayCard
                                            title="Valoarea estimată a stocului"
                                            value={formatCurrency(
                                                estimatedStockValue
                                            )}
                                            description="Pe baza costului mediu de achiziție"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Stocul curent × Costul mediu de
                                        achiziție
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full">
                                        <MetricDisplayCard
                                            title="Marja de profit estimată"
                                            value={
                                                <span
                                                    className={
                                                        estimatedProfitMargin >
                                                        0
                                                            ? "text-green-600"
                                                            : estimatedProfitMargin <
                                                              0
                                                            ? "text-destructive"
                                                            : ""
                                                    }
                                                >
                                                    {formatPercentage(
                                                        estimatedProfitMargin
                                                    )}
                                                </span>
                                            }
                                            description="Pe baza prețului actual de vânzare"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Procentul de profit: (Prețul de vânzare
                                        - Costul mediu de achiziție) / Prețul de
                                        vânzare
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
