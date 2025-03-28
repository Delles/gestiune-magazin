// src/app/(authenticated)/inventory/_components/stock-adjustment/components/StockAdjustmentActions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Minus } from "lucide-react";

interface StockAdjustmentActionsProps {
    isSubmitting: boolean;
    isPending: boolean;
    isIncreaseType: boolean;
    onClose?: () => void;
}

export function StockAdjustmentActions({
    isSubmitting,
    isPending,
    isIncreaseType,
    onClose,
}: StockAdjustmentActionsProps) {
    const isLoading = isSubmitting || isPending;

    return (
        <div className="flex justify-end gap-2">
            {onClose && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            )}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        {isIncreaseType ? (
                            <Plus className="mr-2 h-4 w-4" />
                        ) : (
                            <Minus className="mr-2 h-4 w-4" />
                        )}
                        Submit Adjustment
                    </>
                )}
            </Button>
        </div>
    );
}
