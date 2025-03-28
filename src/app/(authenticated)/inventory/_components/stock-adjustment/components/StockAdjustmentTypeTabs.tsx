// src/app/(authenticated)/inventory/_components/stock-adjustment/components/StockAdjustmentTypeTabs.tsx
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from "lucide-react";
// Import the type from the main index file
import type { StockAdjustmentType } from "../index";

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
            // Ensure the passed value is cast correctly if needed,
            // though RHF's watch should provide the correct type.
            onValueChange={(value) =>
                onTypeChange(value as StockAdjustmentType)
            }
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="increase">
                    <Plus className="mr-2 h-4 w-4" /> Increase Stock
                </TabsTrigger>
                <TabsTrigger value="decrease">
                    <Minus className="mr-2 h-4 w-4" /> Decrease Stock
                </TabsTrigger>
            </TabsList>
            {/* Tabs component only contains TabsList and TabsTrigger here */}
            {/* The content associated with each tab value is handled outside */}
        </Tabs>
    );
}
