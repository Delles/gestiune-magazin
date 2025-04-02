import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, Package, PencilIcon } from "lucide-react"; // Icons for layout consistency
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ItemDetailHeaderSkeleton() {
    return (
        <>
            {/* Back Navigation Skeleton */}
            <div className="flex items-center space-x-2 mb-4">
                <Button variant="outline" size="sm" disabled>
                    <ArrowLeftIcon className="mr-1 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>

            {/* Item Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div className="space-y-2">
                    {" "}
                    {/* Adjusted spacing for skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-md" />{" "}
                        {/* Icon Placeholder */}
                        <Skeleton className="h-7 w-48" />{" "}
                        {/* Title Placeholder */}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground/50" />{" "}
                        {/* Keep real icon slightly muted */}
                        <Skeleton className="h-5 w-24" />{" "}
                        {/* Category Badge Placeholder */}
                        <Separator orientation="vertical" className="h-4" />
                        <Skeleton className="h-5 w-16" />{" "}
                        {/* Unit Placeholder */}
                    </div>
                </div>

                {/* Edit Button Skeleton */}
                <Button variant="outline" disabled>
                    <PencilIcon className="mr-2 h-4 w-4" /> Edit Item
                </Button>
            </div>
        </>
    );
}
