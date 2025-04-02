"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    Warehouse,
    DollarSign,
    Hash,
    PlusIcon,
    MinusIcon,
    AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import StockAdjustmentForm from "../../_components/stock-adjustment"; // Adjust path as necessary

interface ItemStatsGridProps {
    itemId: string;
    itemName: string;
    currentStock: number;
    unit: string;
    isLowStock: boolean;
    reorderPoint: number | null;
    lastPurchasePrice: number;
    averagePurchasePrice: number;
    sellingPrice: number;
}

export default function ItemStatsGrid({
    itemId,
    itemName,
    currentStock,
    unit,
    isLowStock,
    reorderPoint,
    lastPurchasePrice,
    averagePurchasePrice,
    sellingPrice,
}: ItemStatsGridProps) {
    const [addPopoverOpen, setAddPopoverOpen] = useState(false);
    const [reducePopoverOpen, setReducePopoverOpen] = useState(false);

    const handleClosePopovers = () => {
        setAddPopoverOpen(false);
        setReducePopoverOpen(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Stock Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Current Stock
                    </CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <div
                        className={cn(
                            "text-2xl font-bold",
                            isLowStock && "text-destructive"
                        )}
                    >
                        {currentStock} {unit}
                    </div>
                    {isLowStock && reorderPoint !== null && (
                        <p className="text-xs text-destructive flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Stock is at or below reorder point ({reorderPoint}
                            {unit})
                        </p>
                    )}
                    <div className="flex gap-2 pt-2">
                        {/* Replace Dialog with Popover for Add */}
                        <Popover
                            open={addPopoverOpen}
                            onOpenChange={setAddPopoverOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <PlusIcon className="mr-1 h-4 w-4" />
                                    Add
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80"
                                side="bottom"
                                align="start"
                            >
                                <StockAdjustmentForm
                                    itemId={itemId}
                                    itemName={itemName}
                                    currentStock={currentStock}
                                    unit={unit}
                                    initialType="increase"
                                    onSuccess={handleClosePopovers}
                                    onClose={handleClosePopovers}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Replace Dialog with Popover for Reduce */}
                        <Popover
                            open={reducePopoverOpen}
                            onOpenChange={setReducePopoverOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={
                                        isLowStock ? "destructive" : "outline"
                                    }
                                    disabled={currentStock <= 0}
                                >
                                    <MinusIcon className="mr-1 h-4 w-4" />
                                    Reduce
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80"
                                side="bottom"
                                align="start"
                            >
                                <StockAdjustmentForm
                                    itemId={itemId}
                                    itemName={itemName}
                                    currentStock={currentStock}
                                    unit={unit}
                                    initialType="decrease"
                                    onSuccess={handleClosePopovers}
                                    onClose={handleClosePopovers}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {/* Last Purchase Price Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Last Purchase Price
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(lastPurchasePrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Most recent cost per unit recorded
                    </p>
                </CardContent>
            </Card>

            {/* Average Purchase Price Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Average Purchase Price
                    </CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(averagePurchasePrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Weighted average cost based on purchases
                    </p>
                </CardContent>
            </Card>

            {/* Selling Price Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Selling Price
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(sellingPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Revenue per unit
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
