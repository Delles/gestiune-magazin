import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react"; // Icons for layout

export default function ItemAdditionalInfoSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    Additional Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Reorder Point Skeleton */}
                <div className="flex items-start space-x-3 p-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground/50" />
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-5 w-1/4" /> {/* Title */}
                        <Skeleton className="h-4 w-3/4" /> {/* Text */}
                    </div>
                </div>
                {/* Separator Placeholder (Optional, or just rely on spacing) */}
                {/* <Skeleton className="h-px w-full my-3" /> */}

                {/* Description Skeleton */}
                <div className="flex items-start space-x-3 p-3">
                    <Info className="h-5 w-5 mt-0.5 text-muted-foreground/50" />
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-5 w-1/4" /> {/* Title */}
                        <Skeleton className="h-4 w-full" /> {/* Text Line 1 */}
                        <Skeleton className="h-4 w-5/6" /> {/* Text Line 2 */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
