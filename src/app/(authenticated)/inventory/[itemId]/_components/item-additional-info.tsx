import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";

interface ItemAdditionalInfoProps {
    description: string | null;
    reorderPoint: number | null;
    unit: string;
    isLowStock: boolean;
}

export default function ItemAdditionalInfo({
    description,
    reorderPoint,
    unit,
    isLowStock,
}: ItemAdditionalInfoProps) {
    // Don't render the card if there's nothing to show
    if (!description && reorderPoint === null) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    Additional Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {reorderPoint !== null && (
                    <div
                        className={cn(
                            "flex items-start space-x-3 p-3 rounded-md",
                            isLowStock &&
                                "bg-destructive/10 border border-destructive/20"
                        )}
                    >
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <AlertCircle
                                            className={cn(
                                                "h-5 w-5 mt-0.5",
                                                isLowStock
                                                    ? "text-destructive"
                                                    : "text-muted-foreground"
                                            )}
                                            aria-label="Reorder Point Status"
                                        />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Reorder Point</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div>
                            <p className="text-sm font-medium">Reorder Point</p>
                            <p className="text-sm text-muted-foreground">
                                {reorderPoint} {unit} (Trigger for re-stocking)
                            </p>
                        </div>
                    </div>
                )}

                {reorderPoint !== null && description && (
                    <Separator className="my-3" />
                )}

                {description && (
                    <div className="flex items-start space-x-3 p-3">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Info
                                            className="h-5 w-5 text-muted-foreground mt-0.5"
                                            aria-label="Description Icon"
                                        />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Description</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {description}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
