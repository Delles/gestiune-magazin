// src/app/(authenticated)/inventory/_components/inventory-list.tsx
"use client";

import { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getFacetedRowModel, // For filter counts
    getFacetedUniqueValues, // For filter counts
    flexRender,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    RowSelectionState,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    PlusCircle,
    ArrowUpDown,
    Search,
    Package,
    Pencil,
    BarChart4,
    Eye,
    Filter,
    Trash2,
    X,
    AlertCircle, // For low stock icon
    CheckCircle2, // For in stock
    XCircle, // For out of stock
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import InventoryItemForm from "./inventory-item-form";
import StockAdjustmentForm from "./stock-adjustment";
import { useRouter } from "next/navigation";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useDebounce } from "@/hooks/use-debounce"; // Adjust path if needed
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Define types
type InventoryItem = {
    id: string;
    item_name: string;
    category_id: string | null;
    category_name?: string;
    unit: string;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_point: number | null; // Ensure this is present
    created_at: string;
    updated_at: string;
};

type Category = {
    id: string;
    name: string;
};

// --- API Functions ---
async function getInventoryItems(): Promise<InventoryItem[]> {
    const response = await fetch("/api/inventory/items");
    if (!response.ok) throw new Error("Failed to fetch inventory items");
    return response.json();
}

async function getCategories(): Promise<Category[]> {
    const response = await fetch("/api/categories");
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
}

async function deleteInventoryItems(itemIds: string[]) {
    // In a real app, you'd likely have a dedicated bulk delete API endpoint
    // For now, we delete one by one, showing individual toasts
    const results = await Promise.allSettled(
        itemIds.map((id) =>
            fetch(`/api/inventory/items/${id}`, { method: "DELETE" })
        )
    );

    const errors = results.filter((r) => r.status === "rejected");
    const successes = results.filter((r) => r.status === "fulfilled");

    successes.forEach(() => toast.success("Item deleted successfully")); // Basic success message
    errors.forEach((e) =>
        toast.error(
            `Failed to delete an item: ${
                (e.reason as Error)?.message || "Unknown error"
            }`
        )
    );

    if (errors.length > 0) throw new Error("Some items failed to delete.");
}
// --- End API Functions ---

// --- Stock Status Options ---
const stockStatuses = [
    { value: "in_stock", label: "In Stock", icon: CheckCircle2 },
    { value: "low_stock", label: "Low Stock", icon: AlertCircle },
    { value: "out_of_stock", label: "Out of Stock", icon: XCircle },
];

export default function InventoryList() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Dialog states
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [adjustingStockItem, setAdjustingStockItem] =
        useState<InventoryItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    const queryClient = useQueryClient();
    const router = useRouter();

    // --- Data Fetching ---
    const {
        data: inventoryItems = [],
        isLoading: isLoadingItems,
        error: itemsError,
    } = useQuery({
        queryKey: ["inventoryItems"],
        queryFn: getInventoryItems,
    });

    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        error: categoriesError,
    } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
    // --- End Data Fetching ---

    // --- Mutations ---
    const deleteMutation = useMutation({
        mutationFn: deleteInventoryItems,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({ queryKey: ["inventoryStats"] }); // Invalidate stats if you have them
            setRowSelection({}); // Clear selection
            setIsDeleteDialogOpen(false);
        },
        onError: (error) => {
            // Toast handled within mutationFn for individual errors
            console.error("Bulk delete error:", error);
        },
    });
    // --- End Mutations ---

    // --- Column Definitions ---
    const columns: ColumnDef<InventoryItem>[] = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                "indeterminate")
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                        className="translate-y-[2px]"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="translate-y-[2px]"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "item_name",
                header: ({ column }) => (
                    <SortableHeader column={column}>Item Name</SortableHeader>
                ),
                cell: ({ row }) => {
                    return (
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                                {row.getValue("item_name")}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "category_name",
                header: ({ column }) => (
                    <SortableHeader column={column}>Category</SortableHeader>
                ),
                cell: ({ row }) => {
                    const categoryName =
                        (row.getValue("category_name") as string) ||
                        "Uncategorized";
                    return (
                        <Badge
                            variant="secondary"
                            className="font-normal whitespace-nowrap"
                        >
                            {categoryName}
                        </Badge>
                    );
                },
                filterFn: (row, id, value) => value.includes(row.getValue(id)),
                // enableColumnFilter: true, // Enable filtering on this column
            },
            {
                accessorKey: "stock_quantity",
                header: ({ column }) => (
                    <SortableHeader column={column} align="right">
                        Stock
                    </SortableHeader>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    const quantity = item.stock_quantity;
                    const reorderPoint = item.reorder_point;
                    const unit = item.unit;

                    let status: "in_stock" | "low_stock" | "out_of_stock" =
                        "in_stock";
                    if (quantity <= 0) {
                        status = "out_of_stock";
                    } else if (
                        reorderPoint !== null &&
                        quantity <= reorderPoint
                    ) {
                        status = "low_stock";
                    }

                    const statusConfig = stockStatuses.find(
                        (s) => s.value === status
                    )!;

                    return (
                        <div className="text-right flex flex-col items-end">
                            <span className="font-semibold">
                                {quantity}{" "}
                                <span className="text-xs text-muted-foreground">
                                    {unit}
                                </span>
                            </span>
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            className={`flex items-center text-xs mt-0.5 ${
                                                status === "low_stock"
                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                    : status === "out_of_stock"
                                                    ? "text-destructive"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            <statusConfig.icon className="h-3 w-3 mr-1 shrink-0" />
                                            {statusConfig.label}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {status === "low_stock" &&
                                            `At or below reorder point (${reorderPoint} ${unit})`}
                                        {status === "out_of_stock" &&
                                            "Item is out of stock"}
                                        {status === "in_stock" &&
                                            "Item is in stock"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    );
                },
                filterFn: (row, id, value: string[]) => {
                    // Filter by status string
                    const item = row.original;
                    const quantity = item.stock_quantity;
                    const reorderPoint = item.reorder_point;
                    let currentStatus: string = "in_stock";
                    if (quantity <= 0) {
                        currentStatus = "out_of_stock";
                    } else if (
                        reorderPoint !== null &&
                        quantity <= reorderPoint
                    ) {
                        currentStatus = "low_stock";
                    }
                    return value.includes(currentStatus);
                },
                // enableColumnFilter: true, // Enable filtering
            },
            {
                accessorKey: "purchase_price",
                header: ({ column }) => (
                    <SortableHeader column={column} align="right">
                        Purchase Price
                    </SortableHeader>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-mono text-sm">
                        {formatCurrency(row.getValue("purchase_price"))}
                    </div>
                ),
            },
            {
                accessorKey: "selling_price",
                header: ({ column }) => (
                    <SortableHeader column={column} align="right">
                        Selling Price
                    </SortableHeader>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-mono text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(row.getValue("selling_price"))}
                    </div>
                ),
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex justify-end gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItemId(item.id);
                                                setIsEditSheetOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">
                                                Edit Item
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>Edit Item</p>
                                    </TooltipContent>
                                </Tooltip>
                                <ActionTooltipButton
                                    tooltip="Adjust Stock"
                                    icon={BarChart4}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAdjustingStockItem(item);
                                    }}
                                />
                                <ActionTooltipButton
                                    tooltip="View Details"
                                    icon={Eye}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/inventory/${item.id}`);
                                    }}
                                />
                            </TooltipProvider>
                        </div>
                    );
                },
            },
        ],
        [router]
    );
    // --- End Column Definitions ---

    // --- Table Instance ---
    const table = useReactTable({
        data: inventoryItems,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter: debouncedGlobalFilter,
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        // onGlobalFilterChange: setGlobalFilter, // Manual debounce
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(), // For filter counts
        getFacetedUniqueValues: getFacetedUniqueValues(), // For filter counts
        initialState: { pagination: { pageSize: 10 } },
    });
    // --- End Table Instance ---

    // --- Filter Logic ---
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const categoryFilter =
        (table.getColumn("category_name")?.getFilterValue() as
            | string[]
            | undefined) ?? [];
    const stockFilter =
        (table.getColumn("stock_quantity")?.getFilterValue() as
            | string[]
            | undefined) ?? [];

    const handleCategoryFilterChange = (
        categoryId: string,
        checked: boolean | string
    ) => {
        const current = categoryFilter;
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;
        const categoryName = category.name;

        let newValues: string[];
        if (checked) {
            newValues = [...current, categoryName];
        } else {
            newValues = current.filter((name) => name !== categoryName);
        }
        table
            .getColumn("category_name")
            ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
    };

    const handleStockFilterChange = (
        statusValue: string,
        checked: boolean | string
    ) => {
        const current = stockFilter;
        let newValues: string[];
        if (checked) {
            newValues = [...current, statusValue];
        } else {
            newValues = current.filter((val) => val !== statusValue);
        }
        table
            .getColumn("stock_quantity")
            ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
    };

    const clearAllFilters = () => {
        setColumnFilters([]);
        setGlobalFilter("");
    };

    const activeFilterCount = columnFilters.length;
    const hasActiveFilters = activeFilterCount > 0 || globalFilter !== "";
    // --- End Filter Logic ---

    // --- Helper Functions ---
    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const handleDeleteSelected = () => {
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        const selectedIds = Object.keys(rowSelection);
        deleteMutation.mutate(selectedIds);
    };

    const handleAddSheetClose = () => setIsAddSheetOpen(false);
    // --- End Helper Functions ---

    // --- Loading & Error States ---
    const isLoading = isLoadingItems || isLoadingCategories;
    const queryError = itemsError || categoriesError;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-full" /> {/* Control Bar Skeleton */}
                <Skeleton className="h-12 w-full" />{" "}
                {/* Table Header Skeleton */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}{" "}
                {/* Table Rows Skeleton */}
                <Skeleton className="h-9 w-full mt-4" />{" "}
                {/* Pagination Skeleton */}
            </div>
        );
    }

    if (queryError) {
        return (
            <div className="text-center py-10 text-destructive">
                Error loading data: {queryError.message}
            </div>
        );
    }
    // --- End Loading & Error States ---

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Control Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between py-3">
                    {/* Left Side: Filters & Page Size */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Popover
                            open={filterPopoverOpen}
                            onOpenChange={setFilterPopoverOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
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
                                                        .getColumn(
                                                            "category_name"
                                                        )
                                                        ?.getFilterValue() as string[]) ??
                                                    [];
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
                                                        />
                                                        <Label
                                                            htmlFor={`filter-cat-${cat.id}`}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {cat.name}
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
                                                        onCheckedChange={(
                                                            checked
                                                        ) =>
                                                            handleStockFilterChange(
                                                                status.value,
                                                                checked
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`filter-stock-${status.value}`}
                                                        className="text-sm font-normal cursor-pointer flex items-center"
                                                    >
                                                        <status.icon className="h-3.5 w-3.5 mr-1.5" />
                                                        {status.label}
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
                                        Clear Filters
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {/* Add page size select if needed */}
                    </div>

                    {/* Right Side: Search & Add */}
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search items..."
                                value={globalFilter}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
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
                        <Sheet
                            open={isAddSheetOpen}
                            onOpenChange={setIsAddSheetOpen}
                        >
                            <SheetTrigger asChild>
                                <Button
                                    size="sm"
                                    className="h-9 whitespace-nowrap"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    Item
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0">
                                <SheetHeader className="p-6 pb-4">
                                    <SheetTitle>
                                        Add New Inventory Item
                                    </SheetTitle>
                                    <SheetDescription>
                                        Fill in the details below to add a new
                                        item to your stock.
                                    </SheetDescription>
                                </SheetHeader>
                                <Separator />
                                <div className="p-6">
                                    <InventoryItemForm
                                        onSuccess={handleAddSheetClose}
                                        onClose={handleAddSheetClose}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {table.getIsSomeRowsSelected() ||
                table.getIsAllRowsSelected() ? (
                    <div className="flex items-center gap-3 px-3 py-2 border rounded-md bg-muted mb-4 justify-between animate-in fade-in-50">
                        <span className="text-sm font-medium text-muted-foreground">
                            {table.getSelectedRowModel().rows.length} item(s)
                            selected
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                        </Button>
                    </div>
                ) : null}

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="px-3 py-2 whitespace-nowrap h-auto text-xs uppercase tracking-wider font-semibold text-muted-foreground"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && "selected"
                                        }
                                        onClick={() =>
                                            router.push(
                                                `/inventory/${row.original.id}`
                                            )
                                        }
                                        className="cursor-pointer transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/10 group" // Added group for hover effects
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="px-3 py-3 align-top"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-48 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                                            <Package className="h-12 w-12 text-muted-foreground/50" />
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    No Inventory Items Found
                                                </p>
                                                <p className="text-sm">
                                                    {hasActiveFilters
                                                        ? "Try adjusting your filters or search."
                                                        : "Add your first inventory item!"}
                                                </p>
                                            </div>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearAllFilters}
                                                >
                                                    Clear Filters
                                                </Button>
                                            )}
                                            {!hasActiveFilters && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsAddSheetOpen(true)
                                                    }
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add Item
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4 px-1">
                    <div className="text-sm text-muted-foreground flex-1">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount() || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next</span>
                        </Button>
                    </div>
                </div>

                {/* Edit Sheet */}
                <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                    <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0">
                        <SheetHeader className="p-6 pb-4">
                            <SheetTitle>Edit Inventory Item</SheetTitle>
                            <SheetDescription>
                                Update the details for this item. Note: Unit and
                                stock cannot be changed here.
                            </SheetDescription>
                        </SheetHeader>
                        <Separator />
                        <div className="p-6">
                            {editingItemId && (
                                <InventoryItemForm
                                    itemId={editingItemId}
                                    onSuccess={() => {
                                        setIsEditSheetOpen(false);
                                        setEditingItemId(null);
                                    }}
                                    onClose={() => {
                                        setIsEditSheetOpen(false);
                                        setEditingItemId(null);
                                    }}
                                />
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Stock Adjustment Dialog */}
                {adjustingStockItem && (
                    <Dialog
                        open={!!adjustingStockItem}
                        onOpenChange={(open) => {
                            if (!open) setAdjustingStockItem(null);
                        }}
                    >
                        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                            <VisuallyHidden>
                                <DialogTitle>Stock Adjustment</DialogTitle>
                            </VisuallyHidden>
                            <StockAdjustmentForm
                                itemId={adjustingStockItem.id}
                                itemName={adjustingStockItem.item_name}
                                unit={adjustingStockItem.unit}
                                currentStock={adjustingStockItem.stock_quantity}
                                onSuccess={() => setAdjustingStockItem(null)}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                                Confirm Deletion
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete{" "}
                                {table.getSelectedRowModel().rows.length}{" "}
                                selected item(s)? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-end">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

// --- Helper Components ---
const SortableHeader = ({
    column,
    children,
    align = "left",
}: {
    column: import("@tanstack/react-table").Column<InventoryItem>;
    children: React.ReactNode;
    align?: "left" | "right";
}) => (
    <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={cn(
            "px-0 py-0 h-auto hover:bg-transparent -ml-1",
            align === "right" ? "w-full justify-end" : ""
        )}
    >
        {children}
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/70" />
    </Button>
);

const ActionTooltipButton = ({
    tooltip,
    icon: Icon,
    onClick,
    disabled,
}: {
    tooltip: string;
    icon: React.ElementType;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClick}
                disabled={disabled}
            >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{tooltip}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
);
// --- End Helper Components ---
