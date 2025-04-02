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
    // XCircle is already imported
} from "lucide-react";
import { InventoryItem, Category } from "../types/types";
import AddItemForm from "./add-item-form";
import { SortableHeader } from "./inventory-columns"; // Import SortableHeader

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
}: InventoryTableToolbarProps) {
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
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between py-3">
            {/* Left Side: Filters & Page Size */}
            <div className="flex flex-wrap gap-2 items-center">
                <Popover
                    open={filterPopoverOpen}
                    onOpenChange={setFilterPopoverOpen}
                >
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
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
                                        // --- Get Count ---
                                        const facetedValues = table
                                            .getColumn("category_name")
                                            ?.getFacetedUniqueValues();
                                        const count =
                                            facetedValues?.get(cat.name) ?? 0;
                                        // --- End Get Count ---
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
                                                    } // Disable if count is 0 and not selected
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
                                    // --- Get Count ---
                                    const facetedValues = table
                                        .getColumn("stock_quantity")
                                        ?.getFacetedUniqueValues();
                                    const count =
                                        facetedValues?.get(status.value) ?? 0; // Status value is the key now
                                    // --- End Get Count ---
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
                                                // Optionally disable if count is 0 (and not selected)
                                                // disabled={count === 0 && !filterValue.includes(status.value)}
                                            />
                                            <Label
                                                htmlFor={`filter-stock-${status.value}`}
                                                className="text-sm font-normal cursor-pointer flex items-center justify-between w-full"
                                            >
                                                <span className="flex items-center">
                                                    <status.icon className="h-3.5 w-3.5 mr-1.5" />
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
                        <Separator />
                        <div className="p-2 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                disabled={!hasActiveFilters}
                            >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Clear Filters
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Make Clear Filters button more obvious when active outside popover */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                    >
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Clear ({activeFilterCount + (globalFilter ? 1 : 0)})
                    </Button>
                )}

                {/* Density and Column Visibility Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                            <Settings2 className="mr-2 h-4 w-4" /> View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Table Density</DropdownMenuLabel>
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
                        {table
                            .getAllLeafColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                    onSelect={(e) => e.preventDefault()} // Prevent closing menu
                                >
                                    {getHeaderName(column)}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right Side: Search & Add */}
            <div className="flex gap-2 items-center w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 h-9"
                    />
                    {globalFilter && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setGlobalFilter("")}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
                <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" className="h-9 whitespace-nowrap">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0">
                        <SheetHeader className="p-6 pb-4">
                            <SheetTitle>Add New Inventory Item</SheetTitle>
                            <SheetDescription>
                                Fill in the details below to add a new item to
                                your stock.
                            </SheetDescription>
                        </SheetHeader>
                        <Separator />
                        <div className="p-6">
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
