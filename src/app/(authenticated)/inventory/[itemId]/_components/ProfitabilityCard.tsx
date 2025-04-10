"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { MetricDisplayCard } from "./MetricDisplayCard";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ProfitabilityCardProps {
    estimatedStockValue: number;
    profitPerUnit: number;
    profitMargin: number; // Percentage
    markup: number; // Percentage or Infinity
    unit: string;
    className?: string;
}

export function ProfitabilityCard({
    estimatedStockValue,
    profitPerUnit,
    profitMargin,
    markup,
    unit,
    className,
}: ProfitabilityCardProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-4 h-full",
                className
            )}
        >
            {" "}
            {/* Adjust grid/layout as needed */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <MetricDisplayCard
                            title="Valoarea estimată a stocului"
                            value={formatCurrency(estimatedStockValue)}
                            description="Pe baza costului mediu"
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Stocul curent × Costul mediu de achiziție</p>
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
                                            ? "text-green-600 dark:text-green-500"
                                            : profitPerUnit < 0
                                            ? "text-red-600 dark:text-red-500"
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
                        <p>Profitul monetar pentru fiecare unitate vândută.</p>
                        <p className="text-xs mt-1 border-t pt-1">
                            <span className="font-medium">Formula:</span> Preț
                            vânzare - Cost mediu
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
                                            ? "text-green-600 dark:text-green-500"
                                            : profitMargin < 0
                                            ? "text-red-600 dark:text-red-500"
                                            : ""
                                    )}
                                >
                                    {formatPercentage(profitMargin)}
                                </span>
                            }
                            description="% din prețul de vânzare"
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Procentajul din prețul de vânzare care reprezintă
                            profit.
                        </p>
                        <p className="text-xs mt-1 border-t pt-1">
                            <span className="font-medium">Formula:</span> (Preț
                            vânzare - Cost mediu) / Preț vânzare
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
                                            ? "text-green-600 dark:text-green-500"
                                            : markup < 0
                                            ? "text-red-600 dark:text-red-500"
                                            : ""
                                    )}
                                >
                                    {markup === Infinity
                                        ? "∞"
                                        : formatPercentage(markup)}
                                </span>
                            }
                            description="% creștere de la cost"
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Creșterea procentuală de la cost la prețul de
                            vânzare.
                        </p>
                        <p className="text-xs mt-1 border-t pt-1">
                            <span className="font-medium">Formula:</span> (Preț
                            vânzare - Cost mediu) / Cost mediu
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
