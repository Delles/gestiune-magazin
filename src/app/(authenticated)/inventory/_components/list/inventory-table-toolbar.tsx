"use client"; // Needs client hooks for state, popover, dropdown

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Search,
    X,
    XCircle,
    PlusCircle,
    Settings2,
    CheckCircle2, // For stock status filter icon
    AlertCircle, // For stock status filter icon
    Download, // Add Download icon
    ListFilter, // Icon for category filter badge
} from "lucide-react";
import { InventoryItem, Category } from "../../types/types";
import AddItemForm from "../forms/add-item-form";
import { SortableHeader } from "./inventory-columns"; // Import SortableHeader
import { cn } from "@/lib/utils"; // Import cn utility
import {
    InventoryFilterSidebar,
    StockValueRangeFilter,
    ReorderPointFilter,
} from "./inventory-filter-sidebar";

// --- Stock Status Options (Moved from columns, as filter UI is here) ---
const stockStatuses = [
    { value: "in_stock", label: "In Stock", icon: CheckCircle2 },
    { value: "low_stock", label: "Low Stock", icon: AlertCircle },
    { value: "out_of_stock", label: "Out of Stock", icon: XCircle },
];

// Define Props
interface InventoryTableToolbarProps {
    table: Table<InventoryItem>;
    categories: Category[];
    density: "compact" | "normal" | "comfortable";
    handleDensityChange: (value: "compact" | "normal" | "comfortable") => void;
    // Visibility state is managed internally by table.setColumnVisibility, no need to pass state itself
    // handleVisibilityChange: (updater: React.SetStateAction<VisibilityState>) => void; // No longer needed here
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    clearAllFilters: () => void;
    isAddSheetOpen: boolean;
    setIsAddSheetOpen: (open: boolean) => void;
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
    onExportCsv: () => void; // Add prop for export handler
}

export function InventoryTableToolbar({
    // Make sure to export the component
    table,
    categories,
    density,
    handleDensityChange,
    globalFilter,
    setGlobalFilter,
    clearAllFilters,
    isAddSheetOpen,
    setIsAddSheetOpen,
    stockValueRange,
    reorderPointFilter,
    handleStockValueRangeChange,
    handleReorderPointFilterChange,
    handleCategoryFilterChange,
    handleStockFilterChange,
    onExportCsv, // Destructure new prop
}: InventoryTableToolbarProps) {
    // Get active filter values
    const categoryFilterColumn = table.getColumn("category_name");
    const categoryFilterValue =
        (categoryFilterColumn?.getFilterValue() as string[]) ?? [];
    const stockFilterColumn = table.getColumn("stock_quantity");
    const stockFilterValue =
        (stockFilterColumn?.getFilterValue() as string[]) ?? [];

    // Calculate active filter count here
    const activeFilterCount =
        categoryFilterValue.length +
        stockFilterValue.length +
        (stockValueRange.min !== null || stockValueRange.max !== null ? 1 : 0) + // Add stock value range filter
        (reorderPointFilter !== null ? 1 : 0) + // Add reorder point filter
        (globalFilter ? 1 : 0); // Keep global filter check

    // Helper function to get header name for visibility toggle
    const getHeaderName = (column: Column<InventoryItem, unknown>): string => {
        const headerDef = column.columnDef.header;

        if (typeof headerDef === "string") {
            return headerDef;
        }

        if (React.isValidElement(headerDef)) {
            const element = headerDef as React.ReactElement<{
                children?: React.ReactNode;
            }>;
            if (element.type === SortableHeader && element.props) {
                const children = element.props.children;
                if (typeof children === "string") {
                    return children;
                }
                if (Array.isArray(children)) {
                    const textChild = children.find(
                        (child: React.ReactNode): child is string =>
                            typeof child === "string"
                    );
                    if (textChild) return textChild;
                }
            }
        }

        // Fallback to formatted column ID
        return column.id
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase());
    };

    const handleAddSheetClose = () => setIsAddSheetOpen(false);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
            {/* Group 1 (Left/Center): Filters, Badges, Clear, Search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Filter Sheet Trigger Button */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 transition-colors duration-150 relative"
                        >
                            <ListFilter className="mr-2 h-4 w-4" /> Filter
                            {activeFilterCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                                >
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <InventoryFilterSidebar
                        categories={categories}
                        categoryFilterValue={categoryFilterValue}
                        stockFilterValue={stockFilterValue}
                        stockValueRange={stockValueRange}
                        reorderPointFilter={reorderPointFilter}
                        handleCategoryFilterChange={handleCategoryFilterChange}
                        handleStockFilterChange={handleStockFilterChange}
                        handleStockValueRangeChange={
                            handleStockValueRangeChange
                        }
                        handleReorderPointFilterChange={
                            handleReorderPointFilterChange
                        }
                        clearAllFilters={clearAllFilters}
                        activeFilterCount={activeFilterCount}
                    />
                </Sheet>

                {/* Active Filter Badges */}
                <div className="flex items-center gap-1.5">
                    {categoryFilterValue.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="px-1.5 py-0.5 text-xs font-normal"
                        >
                            <ListFilter className="h-3 w-3 mr-1" />
                            Category ({categoryFilterValue.length})
                        </Badge>
                    )}
                    {stockFilterValue.length > 0 && (
                        <Badge
                            variant={
                                stockFilterValue.length === 1 &&
                                stockFilterValue[0] === "out_of_stock"
                                    ? "destructive"
                                    : "secondary"
                            }
                            className={cn(
                                "px-1.5 py-0.5 text-xs font-normal",
                                stockFilterValue.length === 1 &&
                                    stockFilterValue[0] === "low_stock" &&
                                    "badge-warning"
                            )}
                        >
                            {stockFilterValue.length === 1 ? (
                                stockStatuses.find(
                                    (s) => s.value === stockFilterValue[0]
                                )?.icon &&
                                React.createElement(
                                    stockStatuses.find(
                                        (s) => s.value === stockFilterValue[0]
                                    )!.icon,
                                    { className: "h-3 w-3 mr-1" }
                                )
                            ) : (
                                <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            Status ({stockFilterValue.length})
                        </Badge>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        value={globalFilter ?? ""}
                        onChange={(event) =>
                            setGlobalFilter(event.target.value)
                        }
                        className="h-9 pl-9 w-full focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
                    />
                    {globalFilter && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setGlobalFilter("")}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear search</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Group 2 (Right): View, Export, Add */}
            <div className="flex items-center gap-2">
                {/* View Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 transition-colors duration-150"
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Density</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={density}
                            onValueChange={
                                handleDensityChange as (value: string) => void
                            }
                        >
                            <DropdownMenuRadioItem value="compact">
                                Compact
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="normal">
                                Normal
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="comfortable">
                                Comfortable
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== "undefined" &&
                                    column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {getHeaderName(column)}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Export Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 ml-auto sm:ml-0 transition-colors duration-150"
                    onClick={onExportCsv}
                    disabled={!table.getFilteredRowModel().rows.length}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>

                {/* Add Item Button / Sheet */}
                <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            size="sm"
                            className="h-9 transition-colors duration-150"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-xl">
                        <SheetHeader>
                            <SheetTitle>Add New Inventory Item</SheetTitle>
                            <SheetDescription>
                                Enter the details for the new inventory item.
                            </SheetDescription>
                        </SheetHeader>
                        <Separator className="my-4" />
                        <div className="px-6 pb-6">
                            <AddItemForm
                                onSuccess={handleAddSheetClose}
                                onClose={handleAddSheetClose}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
