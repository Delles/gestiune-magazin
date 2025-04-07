import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, Package, PencilIcon, MoreVertical } from "lucide-react"; // Keep relevant icons

export default function ItemDetailHeaderSkeleton() {
    return (
        // Wrap in sticky container to match the actual component
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-4 mb-6 border-b">
            {/* Back Navigation Skeleton */}
            <div className="flex items-center space-x-2 mb-4">
                <Button variant="outline" size="sm" disabled>
                    <ArrowLeftIcon className="mr-1 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>

            {/* Item Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Left Side: Info Skeleton */}
                <div className="flex-1 space-y-2 min-w-0">
                    {/* Title Row Skeleton with potential Badge Skeletons */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-md" />{" "}
                            {/* Icon Skeleton */}
                            <Skeleton className="h-7 w-48" />{" "}
                            {/* Title Skeleton */}
                        </div>
                        <Skeleton className="h-5 w-16" />{" "}
                        {/* Potential Status Badge Skeleton */}
                    </div>
                    {/* Details Row Skeleton */}
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                        <Package className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        <Skeleton className="h-5 w-24" />{" "}
                        {/* Category Badge Skeleton */}
                        <Separator
                            orientation="vertical"
                            className="h-4 mx-1"
                        />
                        <Skeleton className="h-5 w-16" /> {/* Unit Skeleton */}
                    </div>
                </div>

                {/* Right Side: Actions Skeleton - Updated to match new layout */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
                    {/* Edit Button Skeleton */}
                    <Button variant="outline" disabled>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        <Skeleton className="h-4 w-8" />
                    </Button>

                    {/* Dropdown Menu Button Skeleton */}
                    <Button variant="ghost" size="icon" disabled>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
