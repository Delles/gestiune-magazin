import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, DollarSign, Hash, PlusIcon, MinusIcon } from "lucide-react"; // Icons for layout
import { Button } from "@/components/ui/button";

export default function ItemStatsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Stock Card Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Current Stock
                    </CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground/50" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-8 w-1/2" />{" "}
                    {/* Stock Quantity Placeholder */}
                    <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" disabled>
                            <PlusIcon className="mr-1 h-4 w-4" /> Add
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                            <MinusIcon className="mr-1 h-4 w-4" /> Reduce
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Last Purchase Price Card Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Last Purchase Price
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground/50" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {" "}
                    {/* Adjusted spacing */}
                    <Skeleton className="h-8 w-1/3" /> {/* Price Placeholder */}
                    <Skeleton className="h-4 w-4/5" />{" "}
                    {/* Description Placeholder */}
                </CardContent>
            </Card>

            {/* Average Purchase Price Card Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Average Purchase Price
                    </CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground/50" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                </CardContent>
            </Card>

            {/* Selling Price Card Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Selling Price
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600/50 dark:text-green-400/50" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/5" />{" "}
                    {/* Shorter description placeholder */}
                </CardContent>
            </Card>
        </div>
    );
}
