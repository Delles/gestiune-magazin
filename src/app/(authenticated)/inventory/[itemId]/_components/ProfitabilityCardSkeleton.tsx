"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MetricSkeleton = () => (
    <div className="border rounded-lg p-4 flex flex-col justify-between bg-muted/30 min-h-[110px]">
        <div>
            <Skeleton className="h-4 w-3/5 mb-2" /> {/* Title */}
            <Skeleton className="h-6 w-4/5 mb-1" /> {/* Value */}
            <Skeleton className="h-4 w-1/2" /> {/* Description */}
        </div>
        {/* No footer needed for profitability metrics */}
    </div>
);

export function ProfitabilityCardSkeleton({
    className,
}: {
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-4 h-full",
                className
            )}
        >
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
        </div>
    );
}
