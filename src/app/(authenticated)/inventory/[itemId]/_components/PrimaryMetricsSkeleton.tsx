import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrimaryMetricsSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" /> {/* Title Skeleton */}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                    {/* Stock Visual & Quantity Skeleton with +/- buttons */}
                    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/40">
                        {/* Circle Stock Indicator Skeleton */}
                        <Skeleton className="w-16 h-16 rounded-full" />

                        {/* Status Text Skeleton */}
                        <div className="text-center">
                            <Skeleton className="h-3 w-12 mx-auto mb-1" />{" "}
                            {/* Status text */}
                            <Skeleton className="h-4 w-8 mx-auto" />{" "}
                            {/* Unit text */}
                        </div>

                        {/* +/- Buttons Skeleton */}
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="icon" disabled>
                                <MinusIcon className="h-4 w-4 text-muted-foreground/50" />
                            </Button>
                            <Button variant="outline" size="icon" disabled>
                                <PlusIcon className="h-4 w-4 text-muted-foreground/50" />
                            </Button>
                        </div>
                    </div>

                    {/* Financial Metrics Grid Skeleton */}
                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 flex flex-col justify-between bg-muted/40 h-full min-h-[100px]"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-4 w-3/4 mb-2" />{" "}
                                        {/* Title Skeleton */}
                                        {index === 0 && (
                                            <Skeleton className="h-4 w-4 rounded-full" />
                                        )}{" "}
                                        {/* Edit icon for reorder point */}
                                    </div>
                                    <Skeleton className="h-6 w-1/2 mb-2" />{" "}
                                    {/* Value Skeleton */}
                                    <Skeleton className="h-3 w-full" />{" "}
                                    {/* Description Skeleton */}
                                </div>
                                {index === 3 && (
                                    <div className="mt-2">
                                        <Skeleton className="h-5 w-16" />{" "}
                                        {/* Trend indicator skeleton */}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
