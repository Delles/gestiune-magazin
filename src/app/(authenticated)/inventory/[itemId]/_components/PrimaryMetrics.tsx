"use client";

import React, { useState, useEffect, useRef } from "react";
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
    MinusIcon,
    PlusIcon,
    AlertTriangleIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    InfoIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateItemReorderPoint } from "../../_data/api";
import { toast } from "sonner";
import AdjustReorderPointPopoverContent from "./AdjustReorderPointPopoverContent";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import IncreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/IncreaseStockForm";
import DecreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/DecreaseStockForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// Explicit props interface for MetricDisplayCard
interface MetricDisplayCardProps {
    title: string;
    value: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    titleClassName?: string;
    valueClassName?: string;
}

// Helper component for consistent metric display using React.FC
const MetricDisplayCard: React.FC<MetricDisplayCardProps> = ({
    title,
    value,
    description,
    footer,
    icon,
    className,
    titleClassName,
    valueClassName,
}) => (
    <div
        className={cn(
            "border rounded-lg p-4 flex flex-col justify-between bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 h-full min-h-[110px] shadow-sm hover:shadow",
            className
        )}
    >
        <div>
            <div className="flex justify-between items-start gap-2 mb-1">
                <p
                    className={cn(
                        "text-sm font-semibold text-muted-foreground",
                        titleClassName
                    )}
                >
                    {title}
                </p>
                {icon}
            </div>
            <p
                className={cn(
                    "text-xl font-bold truncate tracking-tight",
                    valueClassName
                )}
            >
                {value}
            </p>
            {description && (
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            )}
        </div>
        {footer && <div className="mt-2 text-xs">{footer}</div>}
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
    const [isReorderPopoverOpen, setIsReorderPopoverOpen] = useState(false);
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
    const [isReduceStockDialogOpen, setIsReduceStockDialogOpen] =
        useState(false);
    const isMounted = useRef(true);
    const queryClient = useQueryClient();

    // Set up effect to track component mount status
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

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
            if (isMounted.current) {
                setIsReorderPopoverOpen(false);
            }
        },
        onError: (error) => {
            toast.error(
                `Nu s-a putut actualiza punctul de reaprovizionare: ${error.message}`
            );
        },
    });

    const handleSaveReorderPoint = (data: { reorder_point: number | null }) => {
        mutation.mutate({ id: itemId, reorder_point: data.reorder_point });
    };

    const handleStockAdjustmentSuccess = () => {
        if (isMounted.current) {
            setIsAddStockDialogOpen(false);
            setIsReduceStockDialogOpen(false);
        }
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

    const stockPercentage =
        reorder_point !== null && reorder_point > 0
            ? (stock_quantity / reorder_point) * 100 // Keep the actual percentage, can be > 100
            : null;

    // Value for the progress bar visual fill (capped at 100)
    const progressBarValue =
        stockPercentage !== null ? Math.min(100, stockPercentage) : 0;

    const isOverStocked = stockPercentage !== null && stockPercentage > 100;

    const stockStatus = isOutOfStock
        ? {
              text: "Fără stoc",
              color: "bg-destructive",
              iconColor: "text-destructive",
          }
        : isLowStock
        ? {
              text: "Stoc scăzut",
              color: "bg-amber-500",
              iconColor: "text-amber-500",
          }
        : isOverStocked
        ? {
              text: "Peste limita de reaprovizionare",
              color: "bg-blue-500",
              iconColor: "text-blue-500",
          } // Added OverStocked state
        : {
              text: "În stoc",
              color: "bg-emerald-500",
              iconColor: "text-emerald-500",
          };

    // Determine progress bar color based on detailed status
    const progressBarColor = isOutOfStock
        ? "bg-destructive"
        : isLowStock
        ? "bg-amber-500"
        : isOverStocked
        ? "bg-blue-500" // Use blue for over 100%
        : "bg-emerald-500"; // Default green for in stock (<= 100%)

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPercentage = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return `${value.toFixed(1)}%`;
    };

    const formatNumber = (
        value: number | null | undefined,
        suffix: string = ""
    ) => {
        if (value === null || value === undefined) return "N/A";
        return `${value}${suffix}`;
    };

    const sellPrice = selling_price ?? 0;
    const avgCost = average_purchase_price ?? 0;
    const lastCost = last_purchase_price ?? 0;

    const estimatedStockValue = stock_quantity * avgCost;

    // Calculate profit per unit (selling price - average purchase cost)
    const profitPerUnit = sellPrice - avgCost;

    const profitMargin =
        sellPrice > 0 ? ((sellPrice - avgCost) / sellPrice) * 100 : 0;
    const markup =
        avgCost > 0
            ? ((sellPrice - avgCost) / avgCost) * 100
            : sellPrice > 0
            ? Infinity
            : 0;

    let lastVsAvgDiffPercent: number | null = null;
    if (avgCost !== 0) {
        lastVsAvgDiffPercent = ((lastCost - avgCost) / avgCost) * 100;
    }

    let lastVsSecondLastDiffValue: number | null = null;
    if (last_purchase_price !== null && secondLastPurchasePrice !== null) {
        lastVsSecondLastDiffValue =
            last_purchase_price - secondLastPurchasePrice;
    }

    const renderTrend = (
        value: number | null,
        prefix: string = "",
        suffix: string = ""
    ) => {
        if (value === null || Math.abs(value) < 0.01) {
            return <span className="text-muted-foreground">-</span>;
        }
        const isPositive = value > 0;
        const color = isPositive ? "text-red-500" : "text-green-500";
        const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;

        return (
            <span
                className={cn(
                    "flex items-center gap-1 text-xs font-medium animate-in fade-in-50 duration-500",
                    color
                )}
            >
                <Icon className="h-3.5 w-3.5 animate-in slide-in-from-left-2 duration-300" />
                {`${prefix}${isPositive ? "+" : ""}${value.toFixed(
                    1
                )}${suffix}`}
            </span>
        );
    };

    const renderCurrencyTrend = (value: number | null, prefix: string = "") => {
        if (value === null || Math.abs(value) < 0.01) {
            return <span className="text-muted-foreground">-</span>;
        }
        const isPositive = value > 0;
        const color = isPositive ? "text-red-500" : "text-green-500";
        const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
        return (
            <span
                className={cn(
                    "flex items-center gap-1 text-xs font-medium animate-in fade-in-50 duration-500",
                    color
                )}
            >
                <Icon className="h-3.5 w-3.5 animate-in slide-in-from-left-2 duration-300" />
                {`${prefix}${isPositive ? "+" : ""}${formatCurrency(value)}`}
            </span>
        );
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">
                    Indicatori Primari
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1 bg-muted/40 border-l-4 border border-l-primary/20 rounded-lg overflow-hidden flex flex-col p-4 shadow-sm">
                        <div className="flex flex-col items-center text-center mb-10 mt-4">
                            <div
                                className={cn(
                                    "w-16 h-16 mb-2 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 shadow-md transition-all duration-300 hover:scale-105",
                                    stockStatus.color
                                )}
                            >
                                {stock_quantity}
                            </div>
                            <p
                                className={cn(
                                    "text-sm font-semibold mb-0.5",
                                    stockStatus.iconColor
                                )}
                            >
                                {stockStatus.text}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {unit}(i) în stoc
                            </p>
                        </div>

                        <div className="px-1 mb-10 mt-8">
                            {stockPercentage !== null &&
                                reorder_point !== null && (
                                    <>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                                            <span>Nivelul stocului</span>
                                            <span>
                                                {stockPercentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="w-full">
                                                    <Progress
                                                        value={progressBarValue}
                                                        className={cn(
                                                            "h-2 w-full transition-all duration-700 ease-in-out",
                                                            progressBarColor
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-medium">
                                                        {stock_quantity} /{" "}
                                                        {reorder_point} {unit}
                                                        (i)
                                                    </p>
                                                    {isOverStocked && (
                                                        <p className="text-blue-500">
                                                            (Peste limita de
                                                            reaprovizionare)
                                                        </p>
                                                    )}
                                                    {isLowStock && (
                                                        <p className="text-amber-500">
                                                            (Sub limita de
                                                            reaprovizionare)
                                                        </p>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <p
                                            className={cn(
                                                "text-xs mt-1.5 text-center",
                                                isLowStock
                                                    ? "text-amber-500"
                                                    : isOverStocked
                                                    ? "text-blue-500"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            Punct de reaprovizionare:{" "}
                                            {reorder_point} {unit}(i)
                                        </p>
                                    </>
                                )}
                            {reorder_point === null && (
                                <p className="text-xs text-muted-foreground text-center italic py-3">
                                    Punctul de reaprovizionare nu este setat
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center gap-3 w-full mt-10">
                            <Dialog
                                open={isAddStockDialogOpen}
                                onOpenChange={setIsAddStockDialogOpen}
                            >
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-8 px-4"
                                                >
                                                    <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                                                    Creștere
                                                </Button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Adaugă stoc / Înregistrează
                                                achiziția
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DialogContent
                                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                                    onPointerDownOutside={(e) =>
                                        e.preventDefault()
                                    }
                                >
                                    <IncreaseStockForm
                                        itemId={itemId}
                                        itemName={itemName}
                                        unit={unit}
                                        currentStock={stock_quantity}
                                        onSuccess={handleStockAdjustmentSuccess}
                                        onClose={() => {
                                            if (isMounted.current) {
                                                setIsAddStockDialogOpen(false);
                                            }
                                        }}
                                    />
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
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-8 px-4"
                                                    disabled={
                                                        stock_quantity <= 0
                                                    }
                                                >
                                                    <MinusIcon className="h-3.5 w-3.5 mr-1.5" />
                                                    Reducere
                                                </Button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Reduce stocul / Înregistrează
                                                vânzarea/utilizarea
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DialogContent
                                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                                    onPointerDownOutside={(e) =>
                                        e.preventDefault()
                                    }
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
                                        onClose={() => {
                                            if (isMounted.current) {
                                                setIsReduceStockDialogOpen(
                                                    false
                                                );
                                            }
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Popover
                            open={isReorderPopoverOpen}
                            onOpenChange={setIsReorderPopoverOpen}
                        >
                            <div className="border rounded-lg p-4 flex flex-col justify-between bg-muted/30 min-h-[110px] relative group">
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Punct de reaprovizionare
                                        </p>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Edit reorder point"
                                            >
                                                <PencilIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                    </div>
                                    <p className="text-xl font-semibold truncate">
                                        {formatNumber(
                                            reorder_point,
                                            reorder_point !== null
                                                ? ` ${unit}(i)`
                                                : ""
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 h-8">
                                        Pragul pentru a declanșa
                                        reaprovizionarea.
                                    </p>
                                </div>
                                {reorder_point !== null && (
                                    <div className="mt-2 text-xs">
                                        {stock_quantity <= reorder_point ? (
                                            <p
                                                className={cn(
                                                    "flex items-center gap-1 font-medium",
                                                    stockStatus.iconColor
                                                )}
                                            >
                                                <AlertTriangleIcon className="h-3.5 w-3.5" />
                                                <span>
                                                    {reorder_point -
                                                        stock_quantity}{" "}
                                                    {unit}(i) sub limită
                                                </span>
                                            </p>
                                        ) : (
                                            <p className="flex items-center gap-1 font-medium text-emerald-500">
                                                <InfoIcon className="h-3.5 w-3.5" />
                                                <span>
                                                    {stock_quantity -
                                                        reorder_point}{" "}
                                                    {unit}(i) peste limită
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <PopoverContent
                                className="p-0 w-auto"
                                side="bottom"
                                align="end"
                            >
                                {isReorderPopoverOpen && (
                                    <AdjustReorderPointPopoverContent
                                        initialValue={reorder_point}
                                        unit={unit}
                                        onSave={handleSaveReorderPoint}
                                        onCancel={() => {
                                            if (isMounted.current) {
                                                setIsReorderPopoverOpen(false);
                                            }
                                        }}
                                        isLoading={mutation.isPending}
                                    />
                                )}
                            </PopoverContent>
                        </Popover>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Preț de vânzare"
                                        value={formatCurrency(selling_price)}
                                        description={`Preț per ${unit}`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Prețul la care este vândut acest
                                        articol.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Cost mediu de achiziție"
                                        value={formatCurrency(
                                            average_purchase_price
                                        )}
                                        description={`Cost mediu per ${unit}`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Costul mediu ponderat de achiziție a
                                        acestui articol.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Ultimul cost de achiziție"
                                        value={formatCurrency(
                                            last_purchase_price
                                        )}
                                        description={`Cel mai recent cost per ${unit}`}
                                        footer={
                                            <div className="space-y-1">
                                                {renderCurrencyTrend(
                                                    lastVsSecondLastDiffValue,
                                                    "vs Anterior: "
                                                )}
                                                {renderTrend(
                                                    lastVsAvgDiffPercent,
                                                    "vs Mediu: ",
                                                    "%"
                                                )}
                                            </div>
                                        }
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Costul din cea mai recentă tranzacție de
                                        achiziție.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Valoarea estimată a stocului"
                                        value={formatCurrency(
                                            estimatedStockValue
                                        )}
                                        description="Pe baza costului mediu de achiziție"
                                    />
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
                                    <MetricDisplayCard
                                        title="Profit per unitate"
                                        value={
                                            <span
                                                className={cn(
                                                    profitPerUnit > 0
                                                        ? "text-green-500"
                                                        : profitPerUnit < 0
                                                        ? "text-red-500"
                                                        : ""
                                                )}
                                            >
                                                {formatCurrency(profitPerUnit)}
                                            </span>
                                        }
                                        description={`Profit monetar per ${unit}`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Profitul monetar pentru fiecare unitate
                                        vândută.
                                    </p>
                                    <p className="text-xs mt-1 border-t pt-1">
                                        <span className="font-medium">
                                            Formula:
                                        </span>{" "}
                                        Preț de vânzare - Cost mediu de
                                        achiziție
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Marja de profit"
                                        value={
                                            <span
                                                className={cn(
                                                    profitMargin > 0
                                                        ? "text-green-500"
                                                        : profitMargin < 0
                                                        ? "text-red-500"
                                                        : ""
                                                )}
                                            >
                                                {formatPercentage(profitMargin)}
                                            </span>
                                        }
                                        description="Procentajul din prețul de vânzare care reprezintă profit"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Procentajul din prețul de vânzare care
                                        reprezintă profit.
                                    </p>
                                    <p className="text-xs mt-1 border-t pt-1">
                                        <span className="font-medium">
                                            Formula:
                                        </span>{" "}
                                        (Preț de vânzare - Cost mediu) / Preț de
                                        vânzare
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MetricDisplayCard
                                        title="Adaos comercial"
                                        value={
                                            <span
                                                className={cn(
                                                    markup > 0
                                                        ? "text-green-500"
                                                        : markup < 0
                                                        ? "text-red-500"
                                                        : ""
                                                )}
                                            >
                                                {markup === Infinity
                                                    ? "∞"
                                                    : formatPercentage(markup)}
                                            </span>
                                        }
                                        description="Creșterea procentuală de la cost la prețul de vânzare"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Creșterea procentuală de la cost la
                                        prețul de vânzare.
                                    </p>
                                    <p className="text-xs mt-1 border-t pt-1">
                                        <span className="font-medium">
                                            Formula:
                                        </span>{" "}
                                        (Preț de vânzare - Cost mediu) / Cost
                                        mediu
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
