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
        <div className="mt-2 space-y-1">
            <Skeleton className="h-3 w-4/6" /> {/* Footer line 1 */}
            <Skeleton className="h-3 w-3/6" /> {/* Footer line 2 */}
        </div>
    </div>
);

export function PricingCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 sm:grid-cols-1 gap-4 h-full",
                className
            )}
        >
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton /> {/* Includes footer space for trends */}
        </div>
    );
}
