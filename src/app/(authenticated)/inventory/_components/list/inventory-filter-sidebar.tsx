import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type StockValueRangeFilter = {
    min: number | null;
    max: number | null;
};

export type ReorderPointFilter = boolean | null; // null = any, true = yes, false = no

interface InventoryFilterSidebarProps {
    categories: Tables<"categories">[];
    categoryFilterValue: string[];
    stockFilterValue: string[];
    stockValueRange: StockValueRangeFilter;
    reorderPointFilter: ReorderPointFilter;
    handleStockValueRangeChange: (type: "min" | "max", value: string) => void;
    handleReorderPointFilterChange: (checked: boolean) => void;
    handleCategoryFilterChange: (
        categoryId: string,
        checked: boolean | string
    ) => void;
    handleStockFilterChange: (
        statusValue: string,
        checked: boolean | string
    ) => void;
    clearAllFilters: () => void;
    activeFilterCount: number; // To display badge on clear button
}

export function InventoryFilterSidebar({
    categories,
    categoryFilterValue,
    stockFilterValue,
    stockValueRange,
    reorderPointFilter,
    handleStockValueRangeChange,
    handleReorderPointFilterChange,
    handleCategoryFilterChange,
    handleStockFilterChange,
    clearAllFilters,
    activeFilterCount,
}: InventoryFilterSidebarProps) {
    const stockStatusOptions = [
        { value: "in_stock", label: "In Stock" },
        { value: "low_stock", label: "Low Stock" },
        { value: "out_of_stock", label: "Out of Stock" },
    ];

    return (
        <SheetContent side="left" className="flex flex-col w-full sm:max-w-sm">
            <SheetHeader className="px-6 pt-6">
                <SheetTitle className="text-lg font-semibold">
                    Filter Inventory
                </SheetTitle>
                <SheetDescription>
                    Refine the list of items based on selected criteria.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <ScrollArea className="flex-grow px-6">
                <div className="space-y-6 pb-6">
                    {/* Categories Filter */}
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Category
                        </Label>
                        <div className="space-y-2 pl-1">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`cat-${category.id}`}
                                        checked={categoryFilterValue.includes(
                                            category.name
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleCategoryFilterChange(
                                                category.id,
                                                checked
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`cat-${category.id}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {category.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Stock Status Filter */}
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Stock Status
                        </Label>
                        <div className="space-y-2 pl-1">
                            {stockStatusOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`stock-${option.value}`}
                                        checked={stockFilterValue.includes(
                                            option.value
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleStockFilterChange(
                                                option.value,
                                                checked
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`stock-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stock Value Range Filter */}
                    <Separator />
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Stock Value Range
                        </Label>
                        <div className="flex items-center gap-2 pl-1">
                            <Input
                                type="number"
                                placeholder="Min value"
                                className="h-9"
                                value={stockValueRange.min?.toString() ?? ""}
                                onChange={(e) =>
                                    handleStockValueRangeChange(
                                        "min",
                                        e.target.value
                                    )
                                }
                                min="0"
                                step="0.01"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                placeholder="Max value"
                                className="h-9"
                                value={stockValueRange.max?.toString() ?? ""}
                                onChange={(e) =>
                                    handleStockValueRangeChange(
                                        "max",
                                        e.target.value
                                    )
                                }
                                min={stockValueRange.min ?? 0}
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Has Reorder Point Filter */}
                    <Separator />
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Reorder Point Set
                        </Label>
                        <div className="flex items-center space-x-2 pl-1 pt-1">
                            <Switch
                                id="reorder-point-filter"
                                checked={reorderPointFilter ?? false}
                                onCheckedChange={handleReorderPointFilterChange}
                            />
                            <Label
                                htmlFor="reorder-point-filter"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Only show items with a reorder point set
                            </Label>
                        </div>
                    </div>

                    {/* Placeholder for future filters */}
                    {/* <Separator />
                    <div className="grid gap-3">
                        <Label className="font-semibold">Stock Value Range</Label>
                        {/* Add Input or Slider here */}
                    {/* </div>
                    <Separator />
                    <div className="grid gap-3">
                        <Label className="font-semibold">Reorder Point</Label>
                        {/* Add Switch/Checkbox here */}
                    {/* </div> */}
                </div>
            </ScrollArea>
            <Separator className="mt-auto" />
            <SheetFooter className="flex-col sm:flex-row sm:justify-between gap-2 px-6 py-4 border-t">
                <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className={cn({
                        "relative pr-6": activeFilterCount > 0,
                    })}
                    disabled={activeFilterCount === 0}
                >
                    Clear Filters
                    {activeFilterCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-xs"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
                <SheetClose asChild>
                    <Button>Done</Button>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    );
}
