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
            "border rounded-lg p-4 flex flex-col justify-between bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 h-full min-h-[110px] shadow-sm hover:shadow",
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
