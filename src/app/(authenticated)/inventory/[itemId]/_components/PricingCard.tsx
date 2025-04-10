"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { MetricDisplayCard } from "./MetricDisplayCard"; // Assuming MetricDisplayCard is extracted or available
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PricingCardProps {
    selling_price: number | null;
    average_purchase_price: number | null;
    last_purchase_price: number | null;
    lastVsAvgDiffPercent: number | null;
    lastVsSecondLastDiffValue: number | null;
    unit: string;
    className?: string;
}

// Helper functions moved from PrimaryMetrics (or import if moved to utils)
const renderTrend = (
    value: number | null,
    prefix: string = "",
    suffix: string = ""
) => {
    if (value === null || Math.abs(value) < 0.01) {
        return <span className="text-muted-foreground">-</span>;
    }
    const isPositive = value > 0;
    const color = isPositive ? "text-red-500" : "text-green-500"; // Trend up (cost increase) is red, down is green
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;

    return (
        <span
            className={cn("flex items-center gap-1 text-xs font-medium", color)}
        >
            <Icon className="h-3.5 w-3.5" />
            {`${prefix}${isPositive ? "+" : ""}${value.toFixed(1)}${suffix}`}
        </span>
    );
};

const renderCurrencyTrend = (value: number | null, prefix: string = "") => {
    if (value === null || Math.abs(value) < 0.01) {
        return <span className="text-muted-foreground">-</span>;
    }
    const isPositive = value > 0;
    const color = isPositive ? "text-red-500" : "text-green-500"; // Trend up (cost increase) is red, down is green
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    return (
        <span
            className={cn("flex items-center gap-1 text-xs font-medium", color)}
        >
            <Icon className="h-3.5 w-3.5" />
            {`${prefix}${isPositive ? "+" : ""}${formatCurrency(value)}`}
        </span>
    );
};

export function PricingCard({
    selling_price,
    average_purchase_price,
    last_purchase_price,
    lastVsAvgDiffPercent,
    lastVsSecondLastDiffValue,
    unit,
    className,
}: PricingCardProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 sm:grid-cols-1 gap-4 h-full",
                className
            )}
        >
            {" "}
            {/* Use grid for internal layout */}
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
                        <p>Prețul la care este vândut acest articol.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <MetricDisplayCard
                            title="Cost mediu de achiziție"
                            value={formatCurrency(average_purchase_price)}
                            description={`Cost mediu per ${unit}`}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Costul mediu ponderat de achiziție a acestui
                            articol.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <MetricDisplayCard
                            title="Ultimul cost de achiziție"
                            value={formatCurrency(last_purchase_price)}
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
                            Costul din cea mai recentă tranzacție de achiziție.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
