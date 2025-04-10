"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StockLevelCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("flex flex-col justify-between", className)}>
            <CardContent className="p-4 flex flex-col flex-grow">
                {/* Stock Quantity Skeleton */}
                <div className="flex flex-col items-center text-center mb-6 mt-2">
                    <Skeleton className="w-16 h-16 mb-2 rounded-full" />
                    <Skeleton className="h-5 w-24 mb-0.5" />
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Reorder Point & Progress Skeleton */}
                <div className="px-1 mb-6 mt-auto space-y-3">
                    {/* Reorder Point Skeleton */}
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" /> {/* Title */}
                        <Skeleton className="h-6 w-20" /> {/* Value */}
                        <Skeleton className="h-4 w-24" /> {/* Status line */}
                    </div>

                    {/* Progress Bar Skeleton */}
                    <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                    </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex justify-center gap-3 w-full mt-auto pt-4 border-t border-muted">
                    <Skeleton className="h-8 w-full flex-1" />
                    <Skeleton className="h-8 w-full flex-1" />
                </div>
            </CardContent>
        </Card>
    );
}
