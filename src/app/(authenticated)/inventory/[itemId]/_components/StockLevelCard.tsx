"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils"; // Assuming formatNumber is in utils
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
    InfoIcon,
} from "lucide-react";
import AdjustReorderPointPopoverContent from "./AdjustReorderPointPopoverContent";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface StockLevelCardProps {
    itemId: string; // Needed for AdjustReorderPointPopoverContent? (No, mutation handled in parent)
    itemName: string; // Needed for AdjustReorderPointPopoverContent? (No)
    stock_quantity: number;
    reorder_point: number | null;
    unit: string;
    onAddStockClick: () => void;
    onReduceStockClick: () => void;
    onSaveReorderPoint: (data: { reorder_point: number | null }) => void;
    isSavingReorderPoint: boolean;
    className?: string;
}

export function StockLevelCard({
    stock_quantity,
    reorder_point,
    unit,
    onAddStockClick,
    onReduceStockClick,
    onSaveReorderPoint,
    isSavingReorderPoint,
    className,
}: StockLevelCardProps) {
    const [isReorderPopoverOpen, setIsReorderPopoverOpen] = useState(false);
    const isMounted = useRef(true);

    // Set up effect to track component mount status (needed for Popover close)
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // --- Calculations (Moved from PrimaryMetrics) ---
    const isLowStock =
        reorder_point !== null &&
        stock_quantity <= reorder_point &&
        stock_quantity > 0;
    const isOutOfStock = stock_quantity <= 0;

    const stockPercentage =
        reorder_point !== null && reorder_point > 0
            ? (stock_quantity / reorder_point) * 100
            : null;

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
              color: "bg-amber-500 dark:bg-amber-600",
              iconColor: "text-amber-500 dark:text-amber-400",
          }
        : isOverStocked
        ? {
              text: "Peste limita de reaprovizionare",
              color: "bg-blue-500",
              iconColor: "text-blue-500",
          }
        : {
              text: "În stoc",
              color: "bg-emerald-500",
              iconColor: "text-emerald-500",
          };

    // --- JSX (Migrated from PrimaryMetrics Stock/Reorder Section) ---
    return (
        <Card
            className={cn(
                "flex flex-col justify-between",
                "shadow-soft-md hover:shadow-soft-lg",
                "border border-border",
                "shadow-highlight-top",
                "bg-gradient-to-b from-card to-card/90 dark:from-card dark:to-card/85",
                "transition-all duration-300 ease-in-out",
                className
            )}
        >
            <CardContent className="p-6 flex flex-col flex-grow">
                {/* Stock Quantity Display */}
                <div className="flex flex-col items-center text-center mb-8 mt-2">
                    <div
                        className={cn(
                            "w-16 h-16 mb-2 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0",
                            "shadow-soft-md shadow-soft-inner",
                            "border border-black/5 dark:border-white/10",
                            "transition-all duration-300 hover:scale-105",
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

                {/* Reorder Point & Progress Bar */}
                <div className="px-1 mb-8 mt-auto">
                    {" "}
                    {/* Adjusted margins */}
                    {/* Reorder Point Edit Popover Trigger */}
                    <Popover
                        open={isReorderPopoverOpen}
                        onOpenChange={setIsReorderPopoverOpen}
                    >
                        <div className="relative group mb-3">
                            {" "}
                            {/* Wrapper for edit button positioning */}
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Punct de reaprovizionare
                                </p>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground absolute top-0 right-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" // Ensure focus visibility
                                        aria-label="Edit reorder point"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </PopoverTrigger>
                            </div>
                            <p className="text-lg font-semibold truncate">
                                {formatNumber(reorder_point)}
                                {reorder_point !== null ? ` ${unit}(i)` : ""}
                            </p>
                            {reorder_point === null && (
                                <p className="text-xs text-muted-foreground italic h-[20px]">
                                    (nesetat)
                                </p>
                            )}
                            {reorder_point !== null && (
                                <div className="mt-1 text-xs h-[20px]">
                                    {" "}
                                    {/* Ensure consistent height */}
                                    {stock_quantity <= reorder_point ? (
                                        <p
                                            className={cn(
                                                "flex items-center gap-1 font-medium",
                                                stockStatus.iconColor // Use determined iconColor
                                            )}
                                        >
                                            <AlertTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>
                                                {reorder_point - stock_quantity}{" "}
                                                {unit}(i) sub limită
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="flex items-center gap-1 font-medium text-emerald-500">
                                            <InfoIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>
                                                {stock_quantity - reorder_point}{" "}
                                                {unit}(i) peste limită
                                            </span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Reorder Point Edit Popover Content */}
                        <PopoverContent
                            className="p-0 w-auto"
                            side="bottom"
                            align="end"
                        >
                            {isReorderPopoverOpen && (
                                <AdjustReorderPointPopoverContent
                                    initialValue={reorder_point}
                                    unit={unit}
                                    onSave={(data) => {
                                        onSaveReorderPoint(data);
                                    }}
                                    onCancel={() => {
                                        if (isMounted.current) {
                                            setIsReorderPopoverOpen(false);
                                        }
                                    }}
                                    isLoading={isSavingReorderPoint}
                                />
                            )}
                        </PopoverContent>
                    </Popover>
                    {/* Progress Bar section */}
                    {stockPercentage !== null && reorder_point !== null && (
                        <div className="mt-3">
                            {" "}
                            {/* Add margin top */}
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                                <span>Nivelul stocului</span>
                                <span>{stockPercentage.toFixed(0)}%</span>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="w-full">
                                        <Progress
                                            value={progressBarValue}
                                            className={cn(
                                                "h-2 w-full rounded-full bg-muted transition-all duration-700 ease-in-out"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium">
                                            {stock_quantity} / {reorder_point}{" "}
                                            {unit}(i)
                                        </p>
                                        {isOverStocked && (
                                            <p className="text-blue-500">
                                                (Peste limita de
                                                reaprovizionare)
                                            </p>
                                        )}
                                        {isLowStock && (
                                            <p className="text-amber-500">
                                                (Sub limita de reaprovizionare)
                                            </p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                    {reorder_point === null && (
                        <p className="text-xs text-muted-foreground text-center italic py-3">
                            Stabiliți un punct de reaprovizionare pentru a vedea
                            progresul.
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 w-full mt-auto pt-6 border-t border-border/80">
                    {" "}
                    {/* Pushed to bottom */}
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "text-xs h-8 px-4 flex-1",
                                        "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                                        "border border-black/10 dark:border-white/15",
                                        "hover:bg-accent/50 active:bg-accent/70",
                                        "hover:scale-[1.02] active:scale-[0.98]",
                                        "transition-all duration-150 ease-in-out"
                                    )}
                                    onClick={onAddStockClick}
                                >
                                    <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                                    Creștere
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Adaugă stoc / Înregistrează achiziția</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "text-xs h-8 px-4 flex-1",
                                        "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                                        "border border-black/10 dark:border-white/15",
                                        "hover:bg-accent/50 active:bg-accent/70",
                                        "hover:scale-[1.02] active:scale-[0.98]",
                                        "transition-all duration-150 ease-in-out",
                                        "disabled:opacity-60 disabled:shadow-none disabled:scale-100"
                                    )}
                                    onClick={onReduceStockClick}
                                    disabled={stock_quantity <= 0}
                                >
                                    <MinusIcon className="h-3.5 w-3.5 mr-1.5" />
                                    Reducere
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Reduce stocul / Înregistrează
                                    vânzarea/utilizarea
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );
}
