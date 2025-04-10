"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Explicit props interface for MetricDisplayCard
export interface MetricDisplayCardProps {
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
export const MetricDisplayCard: React.FC<MetricDisplayCardProps> = ({
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
            "border border-border",
            "shadow-highlight-top",
            "rounded-lg p-4 flex flex-col justify-between",
            "bg-gradient-to-b from-card to-card/90 dark:from-card dark:to-card/85",
            "shadow-soft-sm hover:shadow-soft-md",
            "transition-all duration-300 ease-in-out",
            "h-full min-h-[110px]",
            className
        )}
    >
        <div>
            <div className="flex justify-between items-start gap-2 mb-1">
                <p
                    className={cn(
                        "text-sm font-semibold text-muted-foreground", // Changed from font-medium
                        titleClassName
                    )}
                >
                    {title}
                </p>
                {icon}
            </div>
            <p
                className={cn(
                    "text-xl font-bold truncate tracking-tight", // Changed from font-semibold
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
