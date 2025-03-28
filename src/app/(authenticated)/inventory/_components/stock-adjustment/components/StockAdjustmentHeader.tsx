// src/app/(authenticated)/inventory/_components/stock-adjustment/components/StockAdjustmentHeader.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";

interface StockAdjustmentHeaderProps {
    itemName: string;
    currentStock: number;
    unit: string;
}

export function StockAdjustmentHeader({
    itemName,
    currentStock,
    unit,
}: StockAdjustmentHeaderProps) {
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    Adjust Stock: {itemName}
                </h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                <span>Current Stock:</span>
                <Badge variant="secondary">
                    {currentStock} {unit}
                </Badge>
            </div>
        </>
    );
}
