"use client"; // Needs client hooks for state, popover, dropdown

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
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
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Filter,
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
    hasActiveFilters: boolean;
    activeFilterCount: number;
    isAddSheetOpen: boolean;
    setIsAddSheetOpen: (open: boolean) => void;
    filterPopoverOpen: boolean;
    setFilterPopoverOpen: (open: boolean) => void;
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
    hasActiveFilters,
    activeFilterCount,
    isAddSheetOpen,
    setIsAddSheetOpen,
    filterPopoverOpen,
    setFilterPopoverOpen,
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
                {/* Filter Popover Button */}
                <Popover
                    open={filterPopoverOpen}
                    onOpenChange={setFilterPopoverOpen}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 transition-colors duration-150"
                        >
                            <Filter className="mr-2 h-4 w-4" /> Filter
                            {activeFilterCount > 0 && (
                                <>
                                    <Separator
                                        orientation="vertical"
                                        className="mx-2 h-4"
                                    />
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {activeFilterCount}
                                    </Badge>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                            {/* Category Filter */}
                            <div>
                                <h4 className="font-medium leading-none mb-2">
                                    Category
                                </h4>
                                {categories.length > 0 ? (
                                    categories.map((cat) => {
                                        const filterValue =
                                            (table
                                                .getColumn("category_name")
                                                ?.getFilterValue() as string[]) ??
                                            [];
                                        const facetedValues = table
                                            .getColumn("category_name")
                                            ?.getFacetedUniqueValues();
                                        const count =
                                            facetedValues?.get(cat.name) ?? 0;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`filter-cat-${cat.id}`}
                                                    checked={filterValue.includes(
                                                        cat.name
                                                    )}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleCategoryFilterChange(
                                                            cat.id,
                                                            checked
                                                        )
                                                    }
                                                    disabled={
                                                        count === 0 &&
                                                        !filterValue.includes(
                                                            cat.name
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`filter-cat-${cat.id}`}
                                                    className="text-sm font-normal cursor-pointer flex justify-between w-full"
                                                >
                                                    <span>{cat.name}</span>
                                                    {count > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ({count})
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No categories found
                                    </p>
                                )}
                            </div>
                            <Separator />
                            {/* Stock Status Filter */}
                            <div>
                                <h4 className="font-medium leading-none mb-2">
                                    Stock Status
                                </h4>
                                {stockStatuses.map((status) => {
                                    const filterValue =
                                        (table
                                            .getColumn("stock_quantity")
                                            ?.getFilterValue() as string[]) ??
                                        [];
                                    const facetedValues = table
                                        .getColumn("stock_quantity")
                                        ?.getFacetedUniqueValues();
                                    const count =
                                        facetedValues?.get(status.value) ?? 0;
                                    return (
                                        <div
                                            key={status.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={`filter-stock-${status.value}`}
                                                checked={filterValue.includes(
                                                    status.value
                                                )}
                                                onCheckedChange={(checked) =>
                                                    handleStockFilterChange(
                                                        status.value,
                                                        checked
                                                    )
                                                }
                                                disabled={
                                                    count === 0 &&
                                                    !filterValue.includes(
                                                        status.value
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`filter-stock-${status.value}`}
                                                className="text-sm font-normal cursor-pointer flex justify-between items-center w-full"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <status.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {status.label}
                                                </span>
                                                {count > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({count})
                                                    </span>
                                                )}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Clear Button Inside Popover */}
                        {hasActiveFilters && (
                            <div className="p-4 pt-0 border-t">
                                <Button
                                    onClick={() => {
                                        clearAllFilters();
                                        setFilterPopoverOpen(false);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

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

                {/* Clear Filters Button (Outside Popover) */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-destructive/50 transition-colors duration-150"
                    >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Clear
                    </Button>
                )}

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
