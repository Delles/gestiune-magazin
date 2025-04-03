"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface StockQuantityVisualProps {
    quantity: number;
    reorderPoint: number | null;
    unit: string;
}

export const StockQuantityVisual: React.FC<StockQuantityVisualProps> = ({
    quantity,
    reorderPoint,
    unit,
}) => {
    const safeReorderPoint = reorderPoint ?? 0; // Treat null reorder point as 0 for calculations

    // Determine stock status and color
    let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    let barColor = "bg-emerald-500"; // Green - In Stock

    if (quantity <= 0) {
        status = "out_of_stock";
        barColor = "bg-destructive"; // Red - Out of Stock
    } else if (safeReorderPoint > 0 && quantity <= safeReorderPoint) {
        status = "low_stock";
        barColor = "bg-yellow-500"; // Yellow - Low Stock
    }

    // Calculate visual percentages
    // Max scale is dynamically set based on quantity and reorder point
    // Ensures the reorder point marker and quantity fill are reasonably positioned.
    // Use at least reorderPoint * 1.5 or quantity * 1.1, whichever is larger, but minimum of 10
    const maxScale = Math.max(10, quantity * 1.1, safeReorderPoint * 1.5);
    const quantityPercentage = Math.min(100, (quantity / maxScale) * 100);
    const reorderPointPercentage =
        safeReorderPoint > 0
            ? Math.min(100, (safeReorderPoint / maxScale) * 100)
            : null;

    const tooltipText =
        safeReorderPoint > 0
            ? `Current: ${quantity} / Reorder: ${safeReorderPoint} ${unit}`
            : `Current: ${quantity} ${unit}`;

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-start w-32 cursor-default">
                        {/* Current Quantity Text */}
                        <div className="flex items-baseline gap-1 w-full">
                            <span className="font-semibold text-base">
                                {quantity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {unit}
                            </span>
                        </div>

                        {/* Visual Bar Container */}
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
                            {/* Quantity Fill */}
                            <div
                                className={cn(
                                    "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
                                    barColor
                                )}
                                style={{
                                    width: `${quantityPercentage}%`,
                                }}
                            />
                            {/* Reorder Point Marker (if applicable) */}
                            {reorderPointPercentage !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-primary/50" // Primary color, slightly transparent
                                    style={{
                                        left: `${reorderPointPercentage}%`,
                                    }}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                    {status === "low_stock" && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            (Low Stock)
                        </p>
                    )}
                    {status === "out_of_stock" && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            (Out of Stock)
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
