import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PrimaryMetricsSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" /> {/* Title Skeleton */}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                    {/* Stock Visual & Quantity Skeleton */}
                    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/40">
                        <Skeleton className="w-16 h-16 rounded-full mb-2" />{" "}
                        {/* Visual Skeleton */}
                        <Skeleton className="h-4 w-12" />{" "}
                        {/* Status Text Skeleton */}
                        <div className="text-center mt-2">
                            <Skeleton className="h-4 w-24 mb-2" />{" "}
                            {/* Label Skeleton */}
                            <Skeleton className="h-6 w-16" />{" "}
                            {/* Value Skeleton */}
                        </div>
                    </div>

                    {/* Financial Metrics Grid Skeleton */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(5)].map((_, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 flex flex-col justify-between bg-muted/40 h-full min-h-[100px]"
                            >
                                <div>
                                    <Skeleton className="h-4 w-3/4 mb-2" />{" "}
                                    {/* Title Skeleton */}
                                    <Skeleton className="h-6 w-1/2 mb-2" />{" "}
                                    {/* Value Skeleton */}
                                    <Skeleton className="h-3 w-full" />{" "}
                                    {/* Description Skeleton */}
                                </div>
                            </div>
                        ))}
                        {/* Placeholder Metric Skeleton */}
                        <div className="border rounded-lg p-4 flex flex-col justify-center items-center bg-muted/20 h-full min-h-[100px]">
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
