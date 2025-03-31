// src/app/(authenticated)/inventory/_components/stock-adjustment/components/StockAdjustmentTypeTabs.tsx
// (Likely no changes needed, but ensure it's visually distinct)
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from "lucide-react";
import type { StockAdjustmentType } from "../index"; // Use type from index

interface StockAdjustmentTypeTabsProps {
    selectedType: StockAdjustmentType;
    onTypeChange: (type: StockAdjustmentType) => void;
}

export function StockAdjustmentTypeTabs({
    selectedType,
    onTypeChange,
}: StockAdjustmentTypeTabsProps) {
    return (
        <Tabs
            value={selectedType}
            onValueChange={(value) =>
                onTypeChange(value as StockAdjustmentType)
            }
            className="w-full"
        >
            {/* Make tabs more prominent with increased height and larger text */}
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                <TabsTrigger value="increase" className="text-base h-full">
                    <Plus className="mr-2 h-5 w-5" /> Increase Stock
                </TabsTrigger>
                <TabsTrigger value="decrease" className="text-base h-full">
                    <Minus className="mr-2 h-5 w-5" /> Decrease Stock
                </TabsTrigger>
            </TabsList>
            {/* Content is handled outside */}
        </Tabs>
    );
}
