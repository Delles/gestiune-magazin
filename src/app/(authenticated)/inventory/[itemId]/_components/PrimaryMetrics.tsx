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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Explicit props interface for MetricDisplayCard
interface MetricDisplayCardProps {
    title: string;
    value: string | number | React.ReactNode;
    description?: string | React.ReactNode;
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
    secondLastPurchasePrice: number | null;
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
    secondLastPurchasePrice,
    className,
}: PrimaryMetricsProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
    const [isReduceStockDialogOpen, setIsReduceStockDialogOpen] =
        useState(false);
    const queryClient = useQueryClient();

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
        setIsPopoverOpen(false);
    };

    const handleStockAdjustmentSuccess = () => {
        setIsAddStockDialogOpen(false);
        setIsReduceStockDialogOpen(false);
        queryClient.invalidateQueries({
            queryKey: ["inventoryItem", itemId],
        });
        queryClient.invalidateQueries({
            queryKey: ["stockTransactions", itemId],
        });
    };

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

    const formatNullableNumber = (
        value: number | null | undefined,
        suffix: string = ""
    ) => {
        if (value === null || value === undefined) return "N/A";
        return value + suffix;
    };

    let trendIndicator: React.ReactNode = null;
    if (
        last_purchase_price !== null &&
        average_purchase_price !== null &&
        average_purchase_price !== 0
    ) {
        const difference = last_purchase_price - average_purchase_price;
        const percentageDifference =
            (difference / average_purchase_price) * 100;

        let TrendIcon = MinusIcon;
        let colorClass = "bg-muted text-muted-foreground";
        let text = "Stabil";

        if (percentageDifference > 1) {
            TrendIcon = ArrowUpIcon;
            colorClass = "bg-destructive/10 text-destructive";
            text = `${percentageDifference.toFixed(1)}% mai mare`;
        } else if (percentageDifference < -1) {
            TrendIcon = ArrowDownIcon;
            colorClass = "bg-green-500/10 text-green-600";
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

    let lastVsAvgPercentageChangeText: string | null = null;
    if (
        last_purchase_price !== null &&
        average_purchase_price !== null &&
        average_purchase_price !== 0
    ) {
        const percentageDiff =
            ((last_purchase_price - average_purchase_price) /
                average_purchase_price) *
            100;
        if (Math.abs(percentageDiff) >= 0.1) {
            lastVsAvgPercentageChangeText = `${
                percentageDiff > 0 ? "+" : ""
            }${percentageDiff.toFixed(1)}% vs Avg`;
        }
    }

    let lastVsSecondLastDiffText: string | null = null;
    if (last_purchase_price !== null && secondLastPurchasePrice !== null) {
        const diff = last_purchase_price - secondLastPurchasePrice;
        if (Math.abs(diff) >= 0.01) {
            lastVsSecondLastDiffText = `${diff > 0 ? "+" : ""}${formatCurrency(
                diff
            )} vs Prev`;
        }
    }

    const sellPrice = selling_price ?? 0;
    const avgCost = average_purchase_price ?? 0;

    const profitMargin =
        sellPrice > 0 ? ((sellPrice - avgCost) / sellPrice) * 100 : 0;

    const markup =
        avgCost > 0
            ? ((sellPrice - avgCost) / avgCost) * 100
            : sellPrice > 0
            ? Infinity
            : 0;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Indicatori Primari</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/40">
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

                        <div className="flex gap-2 w-full justify-center">
                            <Dialog
                                open={isAddStockDialogOpen}
                                onOpenChange={setIsAddStockDialogOpen}
                            >
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Add Stock
                                                    </span>
                                                </Button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Add Stock</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DialogContent
                                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                                    onPointerDownOutside={(e) =>
                                        e.preventDefault()
                                    }
                                >
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>Add Stock</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-grow overflow-y-auto">
                                        <IncreaseStockForm
                                            itemId={itemId}
                                            itemName={itemName}
                                            unit={unit}
                                            currentStock={stock_quantity}
                                            onSuccess={
                                                handleStockAdjustmentSuccess
                                            }
                                            onClose={() =>
                                                setIsAddStockDialogOpen(false)
                                            }
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={isReduceStockDialogOpen}
                                onOpenChange={setIsReduceStockDialogOpen}
                            >
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="flex-1"
                                                    disabled={
                                                        stock_quantity <= 0
                                                    }
                                                >
                                                    <MinusIcon className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Reduce Stock
                                                    </span>
                                                </Button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Reduce Stock</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DialogContent
                                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                                    onPointerDownOutside={(e) =>
                                        e.preventDefault()
                                    }
                                >
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>Reduce Stock</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-grow overflow-y-auto">
                                        <DecreaseStockForm
                                            itemId={itemId}
                                            itemName={itemName}
                                            unit={unit}
                                            currentStock={stock_quantity}
                                            averagePurchasePrice={
                                                average_purchase_price
                                            }
                                            onSuccess={
                                                handleStockAdjustmentSuccess
                                            }
                                            onClose={() =>
                                                setIsReduceStockDialogOpen(
                                                    false
                                                )
                                            }
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Popover
                            open={isPopoverOpen}
                            onOpenChange={setIsPopoverOpen}
                        >
                            <PopoverTrigger asChild>
                                <div className="relative cursor-pointer hover:bg-muted/80 border rounded-lg p-4 flex flex-col justify-between bg-muted/40 h-full min-h-[100px]">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Punct de reaprovizionare
                                            </p>
                                            <PencilIcon className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                        <p className="text-xl font-semibold truncate">
                                            {formatNullableNumber(
                                                reorder_point,
                                                reorder_point !== null
                                                    ? ` ${unit}(s)`
                                                    : ""
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Nivelul stocului pentru a declanșa
                                            reaprovizionarea. Triggers reorder
                                            below this level.
                                        </p>
                                    </div>
                                    {reorder_point !== null && (
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground">
                                                Diff to Current:{" "}
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        stock_quantity -
                                                            reorder_point <
                                                            0
                                                            ? "text-destructive"
                                                            : "text-emerald-600"
                                                    )}
                                                >
                                                    {stock_quantity -
                                                        reorder_point >=
                                                    0
                                                        ? "+"
                                                        : ""}
                                                    {stock_quantity -
                                                        reorder_point}{" "}
                                                    {unit}(s)
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 w-auto"
                                side="bottom"
                            >
                                {isPopoverOpen && (
                                    <AdjustReorderPointPopoverContent
                                        initialValue={reorder_point}
                                        unit={unit}
                                        onSave={handleSaveReorderPoint}
                                        onCancel={() => setIsPopoverOpen(false)}
                                        isLoading={mutation.isPending}
                                    />
                                )}
                            </PopoverContent>
                        </Popover>

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
                                            description={
                                                lastVsAvgPercentageChangeText ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-xs font-normal py-0.5 px-1",
                                                            lastVsAvgPercentageChangeText.startsWith(
                                                                "+"
                                                            )
                                                                ? "text-destructive"
                                                                : "text-green-600"
                                                        )}
                                                    >
                                                        {
                                                            lastVsAvgPercentageChangeText
                                                        }
                                                    </Badge>
                                                ) : (
                                                    "Costul mediu per unitate"
                                                )
                                            }
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
                                            description={
                                                lastVsSecondLastDiffText ? (
                                                    <span className="text-xs font-normal">
                                                        {
                                                            lastVsSecondLastDiffText
                                                        }
                                                    </span>
                                                ) : (
                                                    "Cel mai recent cost per unitate"
                                                )
                                            }
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

                        {/* START: Profit Margin Card */}
                        <TooltipProvider>
                            <MetricDisplayCard
                                title="Marja Profit (%)"
                                value={formatPercentage(profitMargin)}
                                description="(Vânzare - Cost Mediu) / Vânzare"
                            />
                        </TooltipProvider>
                        {/* END: Profit Margin Card */}

                        {/* START: Markup Card */}
                        <TooltipProvider>
                            <MetricDisplayCard
                                title="Adaos Comercial (%)"
                                value={
                                    markup === Infinity
                                        ? "∞"
                                        : formatPercentage(markup)
                                }
                                description="(Vânzare - Cost Mediu) / Cost Mediu"
                            />
                        </TooltipProvider>
                        {/* END: Markup Card */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
