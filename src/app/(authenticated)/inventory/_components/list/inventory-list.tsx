// src/app/(authenticated)/inventory/_components/inventory-list.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Keep useRouter
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    flexRender,
    SortingState,
    ColumnFiltersState,
    RowSelectionState,
    VisibilityState,
    Row,
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
import { TooltipProvider } from "@/components/ui/tooltip"; // Keep provider for rows
import { Trash2, Loader2 } from "lucide-react";
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
import { useDebounce } from "@/hooks/use-debounce"; // Corrected path
import { toast } from "sonner";
import InlineEditFormRow from "./inline-edit-form";
import DisplayRow from "./display-row";
import { InventoryItem, Category } from "../../types/types"; // Keep types
// --- Import API Functions ---
import {
    getInventoryItems,
    getCategories,
    deleteInventoryItems,
    updateItemReorderPoint,
} from "../../_data/api";
import { cn } from "@/lib/utils"; // Ensure cn is imported
import { formatCurrency } from "@/lib/utils"; // Add formatCurrency import

// --- Import Child Components ---
import { columns } from "./inventory-columns";
import { InventoryTableToolbar } from "./inventory-table-toolbar"; // Add import
import { InventoryBulkActions } from "./inventory-bulk-actions";
import { InventoryTablePagination } from "./inventory-table-pagination";
// START: Import new filter types from sidebar
import {
    StockValueRangeFilter,
    ReorderPointFilter,
} from "./inventory-filter-sidebar";
// END: Import new filter types

// Remove unused date-fns imports
// import { format as formatDate, parseISO } from "date-fns";
// import { ro } from "date-fns/locale";
// Import popover content

export default function InventoryList() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [density, setDensity] = useState<
        "compact" | "normal" | "comfortable"
    >("normal");

    // START: Add state for new filters
    const [stockValueRange, setStockValueRange] =
        useState<StockValueRangeFilter>({ min: null, max: null });
    const [reorderPointFilter, setReorderPointFilter] =
        useState<ReorderPointFilter>(null); // null = any
    // END: Add state for new filters

    // Dialog/Sheet/Popover states
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [adjustingStockItem, setAdjustingStockItem] =
        useState<InventoryItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // TODO: Reinstate when Add Item functionality is implemented
    // const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const [reorderPointItemId, setReorderPointItemId] = useState<string | null>(
        null
    );
    // Remove unused state for now
    // const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams(); // Read search params

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );

    // Get status filter value outside useEffect
    const statusFilterValueFromUrl = searchParams.get("status");

    // Combined useEffect for Persistence (Density & Visibility)
    useEffect(() => {
        const savedDensity = localStorage.getItem("inventoryTableDensity") as
            | typeof density
            | null;
        if (savedDensity) setDensity(savedDensity);

        const savedVisibility = localStorage.getItem(
            "inventoryTableVisibility"
        );
        if (savedVisibility) {
            try {
                setColumnVisibility(JSON.parse(savedVisibility));
            } catch (e) {
                console.error("Failed to parse saved column visibility:", e);
                localStorage.removeItem("inventoryTableVisibility");
            }
        }
    }, []);

    // useEffect for URL-based filtering
    useEffect(() => {
        // Use the extracted value
        if (
            statusFilterValueFromUrl === "low_stock" ||
            statusFilterValueFromUrl === "out_of_stock"
        ) {
            setColumnFilters((prev) => {
                const otherFilters = prev.filter(
                    (f) => f.id !== "stock_quantity"
                );
                return [
                    ...otherFilters,
                    { id: "stock_quantity", value: [statusFilterValueFromUrl] }, // Use the variable here too
                ];
            });
        } else {
            setColumnFilters((prev) =>
                prev.filter((f) => f.id !== "stock_quantity")
            );
        }
        // Depend on the extracted variable
    }, [statusFilterValueFromUrl]);

    // Density Change Handler
    const handleDensityChange = (newDensity: typeof density) => {
        setDensity(newDensity);
        localStorage.setItem("inventoryTableDensity", newDensity);
    };

    // Visibility Change Handler (handled by table.onColumnVisibilityChange)
    const handleVisibilityChange = (
        updater: React.SetStateAction<VisibilityState>
    ) => {
        const newState =
            typeof updater === "function" ? updater(columnVisibility) : updater;
        setColumnVisibility(newState);
        localStorage.setItem(
            "inventoryTableVisibility",
            JSON.stringify(newState)
        );
    };

    // --- Data Fetching ---
    const {
        data: inventoryItems = [],
        isLoading: isLoadingItems,
        error: itemsError,
    } = useQuery<InventoryItem[], Error>({
        queryKey: ["inventoryItems"],
        queryFn: getInventoryItems,
    });

    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        error: categoriesError,
    } = useQuery<Category[], Error>({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
    // --- End Data Fetching ---

    // --- Mutations ---
    const deleteMutation = useMutation({
        mutationFn: deleteInventoryItems,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            setRowSelection({});
            setIsDeleteDialogOpen(false);
            toast.success("Selected items deleted successfully.");
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete items: ${error.message}`);
            setIsDeleteDialogOpen(false);
        },
    });

    const updateReorderPointMutation = useMutation({
        mutationFn: (variables: { id: string; reorder_point: number | null }) =>
            updateItemReorderPoint(variables.id, variables.reorder_point),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", variables.id],
            });
            setReorderPointItemId(null); // Close popover (by clearing the ID)
            toast.success("Reorder point updated successfully.");
        },
        onError: (error: Error) => {
            toast.error(`Failed to update reorder point: ${error.message}`);
            // Close popover even on error for simplicity, or handle differently
            // setReorderPointItemId(null);
        },
    });
    // --- End Mutations ---

    // START: Add handlers for new filters
    const handleStockValueRangeChange = (
        type: "min" | "max",
        value: string
    ) => {
        const numericValue = value === "" ? null : parseFloat(value);
        setStockValueRange((prev) => ({
            ...prev,
            [type]: numericValue,
        }));
    };

    const handleReorderPointFilterChange = (checked: boolean) => {
        // If checked is true, filter for items with a reorder point (filter = true)
        // If checked is false, reset the filter (filter = null)
        setReorderPointFilter(checked ? true : null);
    };
    // END: Add handlers for new filters

    // --- Filtering Logic ---
    // Filtering will be handled by:
    // 1. TanStack Table state (columnFilters, globalFilter)
    // 2. Post-filtering logic applied to `table.getFilteredRowModel().rows` for custom filters
    // --- End Filtering Logic ---

    // --- Table Instance ---
    const table = useReactTable<InventoryItem>({
        data: inventoryItems, // Use the raw data
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter: debouncedGlobalFilter,
            rowSelection,
            columnVisibility,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: handleVisibilityChange,
        initialState: { pagination: { pageSize: 10 } },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });
    // --- End Table Instance ---

    // --- Post-Filtering for Custom Logic ---
    const filteredRows = table.getFilteredRowModel().rows;

    const finalFilteredRows = useMemo(() => {
        return filteredRows.filter((row: Row<InventoryItem>) => {
            const item = row.original;
            // Stock Value Filter
            const stockValue =
                (item.stock_quantity ?? 0) * (item.average_purchase_price ?? 0);
            if (
                stockValueRange.min !== null &&
                stockValue < stockValueRange.min
            )
                return false;
            if (
                stockValueRange.max !== null &&
                stockValue > stockValueRange.max
            )
                return false;

            // Has Reorder Point Filter
            if (
                reorderPointFilter === true &&
                (item.reorder_point === null ||
                    item.reorder_point === undefined)
            )
                return false;
            // Add logic for reorderPointFilter === false if needed

            return true; // Item passes all custom filters
        });
    }, [
        filteredRows, // Depend on the extracted variable
        stockValueRange,
        reorderPointFilter,
    ]);

    // --- Calculated Values ---
    const totalInventoryValue = useMemo(() => {
        // Calculate based on the final filtered rows
        return finalFilteredRows.reduce(
            (sum: number, row: Row<InventoryItem>) => {
                const quantity = row.original.stock_quantity ?? 0;
                const avgPrice = row.original.average_purchase_price ?? 0;
                return sum + quantity * avgPrice;
            },
            0
        );
    }, [finalFilteredRows]);

    // --- Filter Logic ---
    const categoryFilterValue =
        (table.getColumn("category_name")?.getFilterValue() as
            | string[]
            | undefined) ?? [];
    const stockFilterValue =
        (table.getColumn("stock_quantity")?.getFilterValue() as
            | string[]
            | undefined) ?? [];

    const handleCategoryFilterChange = (
        categoryId: string,
        checked: boolean | string
    ) => {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;
        const categoryName = category.name;
        let newValues: string[];
        if (checked) {
            newValues = [...categoryFilterValue, categoryName];
        } else {
            newValues = categoryFilterValue.filter(
                (name) => name !== categoryName
            );
        }
        table
            .getColumn("category_name")
            ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
    };

    const handleStockFilterChange = (
        statusValue: string,
        checked: boolean | string
    ) => {
        let newValues: string[];
        if (checked) {
            newValues = [...stockFilterValue, statusValue];
        } else {
            newValues = stockFilterValue.filter((val) => val !== statusValue);
        }
        table
            .getColumn("stock_quantity")
            ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
    };

    const clearAllFilters = () => {
        setColumnFilters([]);
        setGlobalFilter("");
        setStockValueRange({ min: null, max: null });
        setReorderPointFilter(null);
        router.push("/inventory");
    };

    // Remove commented out variable
    // const hasActiveFilters = table.getState().columnFilters.length > 0;
    // --- End Filter Logic ---

    // --- Helper Handlers ---
    const handleDeleteSelected = () => {
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        const selectedIds = Object.keys(rowSelection);
        deleteMutation.mutate(selectedIds);
    };

    const handleEditClick = (itemId: string) => {
        setEditingRowId(itemId);
    };
    const handleCancelEdit = () => {
        setEditingRowId(null);
    };
    const handleSaveEdit = () => {
        setEditingRowId(null);
    };

    // Define state for modals/dialogs related to the new actions
    // const [adjustingReorderPointItem, setAdjustingReorderPointItem] =
    //     useState<InventoryItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(
        null
    );
    const [isDeleteSingleItemDialogOpen, setIsDeleteSingleItemDialogOpen] =
        useState(false);

    const handleSaveReorderPoint = (newPoint: number | null) => {
        if (reorderPointItemId) {
            updateReorderPointMutation.mutate({
                id: reorderPointItemId,
                reorder_point: newPoint,
            });
        } // Popover closing is handled by onSuccess/onOpenChange
    };

    const handleDeleteItemClick = (item: InventoryItem) => {
        console.log("Delete Item:", item.id); // Placeholder
        setDeletingItem(item);
        setIsDeleteSingleItemDialogOpen(true); // Open single item delete confirmation dialog
    };

    const confirmSingleItemDelete = () => {
        if (deletingItem) {
            deleteMutation.mutate([deletingItem.id]); // Use existing bulk delete mutation
        }
        setIsDeleteSingleItemDialogOpen(false);
        setDeletingItem(null);
    };

    // TODO: Reinstate when export functionality is implemented/refined
    /*
    const handleExportCsv = () => {
        const rows = table.getFilteredRowModel().rows;
        if (!rows.length) {
            toast.warning("No data to export.");
            return;
        }

        const headers = [
            "ID",
            "Item Name",
            "Category",
            "Stock Quantity",
            "Unit",
            "Avg Purch Price",
            "Last Purch Price",
            "Selling Price",
            "Stock Value",
            "Reorder Point",
            "Created At",
            "Last Updated",
        ];

        const formatRoDate = (dateString: string | null): string => {
            if (!dateString) return "";
            try {
                return formatDate(parseISO(dateString), "dd.MM.yyyy HH:mm", {
                    locale: ro,
                });
            } catch {
                return dateString; // fallback
            }
        };

        const data = rows.map((row) => {
            const item = row.original;
            const stockValue = (item.stock_quantity ?? 0) * (item.average_purchase_price ?? 0);
            return [
                `"${item.id}"`, // Ensure ID is treated as string, even if numeric
                `"${item.item_name?.replace(/'"'/g, "''") ?? ""}"`, // Escape quotes
                `"${item.category_name ?? "Uncategorized"}"`, // Handle null category
                item.stock_quantity ?? 0,
                `"${item.unit ?? ""}"`, // Handle null unit
                item.average_purchase_price ?? 0,
                item.last_purchase_price ?? 0,
                item.selling_price ?? 0,
                stockValue,
                item.reorder_point ?? "N/A",
                `"${formatRoDate(item.created_at)}"`, // Format date
                `"${formatRoDate(item.updated_at)}"`, // Format date
            ].join(",");
        });

        const csvContent = [
            headers.join(","),
            ...data,
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { // Add BOM for Excel
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Data exported to CSV.");
    };
    */

    // --- Loading & Error States ---
    const isLoading = isLoadingItems || isLoadingCategories;
    const queryError = itemsError || categoriesError;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
                <Skeleton className="h-9 w-full mt-4" />
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
            <div className={cn("space-y-4 p-1", density)}>
                {/* Render Total Value Above Toolbar */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Inventory List
                    </h2>
                    <div className="text-right">
                        <span className="text-sm text-muted-foreground">
                            Total Stock Value (Filtered):{" "}
                        </span>
                        <span className="font-semibold text-lg">
                            {formatCurrency(totalInventoryValue)}
                        </span>
                    </div>
                </div>

                {/* Toolbar */}
                <InventoryTableToolbar
                    table={table}
                    categories={categories}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    density={density}
                    // @ts-expect-error // TODO: Fix InventoryTableToolbarProps to include setDensity
                    setDensity={handleDensityChange}
                    // START: Pass new filters state and handlers
                    stockValueRange={stockValueRange}
                    reorderPointFilter={reorderPointFilter}
                    handleStockValueRangeChange={handleStockValueRangeChange}
                    handleReorderPointFilterChange={
                        handleReorderPointFilterChange
                    }
                    // END: Pass new filters state and handlers
                    filterPopoverOpen={filterPopoverOpen}
                    setFilterPopoverOpen={setFilterPopoverOpen}
                    handleCategoryFilterChange={handleCategoryFilterChange}
                    handleStockFilterChange={handleStockFilterChange}
                    clearAllFilters={clearAllFilters}
                    categoryFilterValue={categoryFilterValue}
                    stockFilterValue={stockFilterValue}
                />

                {/* Bulk Actions Bar (shown when items selected) */}
                <InventoryBulkActions
                    selectedRowCount={table.getSelectedRowModel().rows.length}
                    onDelete={handleDeleteSelected}
                    isDeleting={deleteMutation.isPending}
                />

                {/* Table */}
                <div className="rounded-md border overflow-hidden">
                    <Table data-density={density}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn({
                                                "py-2 px-2 h-10 text-xs":
                                                    density === "compact",
                                                "py-3 px-3 h-11":
                                                    density === "normal",
                                                "py-4 px-4 h-12":
                                                    density === "comfortable",
                                                "pr-3":
                                                    header.column.id ===
                                                    "actions",
                                            })}
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
                            {isLoadingItems || isLoadingCategories ? (
                                // Skeleton Loading Rows
                                Array.from({
                                    length: table.getState().pagination
                                        .pageSize,
                                }).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        {table.getAllColumns().map((column) => (
                                            <TableCell
                                                key={column.id}
                                                className={getDensityPadding(
                                                    density
                                                )} // Apply density
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : finalFilteredRows.length ? (
                                // Use finalFilteredRows for rendering
                                finalFilteredRows.map((row) => {
                                    const item = row.original;
                                    const isEditing = editingRowId === item.id;
                                    type TanStackRow = Row<InventoryItem>;

                                    if (isEditing) {
                                        return (
                                            <InlineEditFormRow
                                                key={`${row.id}-edit`}
                                                item={row.original}
                                                categories={categories}
                                                onSave={handleSaveEdit}
                                                onCancel={handleCancelEdit}
                                                density={density}
                                                visibleColumns={table
                                                    .getVisibleLeafColumns()
                                                    .map((c) => c.id)}
                                            />
                                        );
                                    } else {
                                        return (
                                            <DisplayRow
                                                key={row.id}
                                                row={row as TanStackRow}
                                                density={density}
                                                router={router}
                                                setAdjustingStockItem={
                                                    setAdjustingStockItem
                                                }
                                                handleEditClick={
                                                    handleEditClick
                                                }
                                                reorderPointItemId={
                                                    reorderPointItemId
                                                }
                                                setReorderPointItemId={
                                                    setReorderPointItemId
                                                }
                                                handleSaveReorderPoint={
                                                    handleSaveReorderPoint
                                                }
                                                isSavingReorderPoint={
                                                    updateReorderPointMutation.isPending
                                                }
                                                handleDeleteItemClick={
                                                    handleDeleteItemClick
                                                }
                                            />
                                        );
                                    }
                                })
                            ) : (
                                // No results row
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <InventoryTablePagination table={table} />

                {/* Stock Adjustment Dialog */}
                {adjustingStockItem && (
                    <Dialog
                        open={!!adjustingStockItem}
                        onOpenChange={(open) => {
                            if (!open) setAdjustingStockItem(null);
                        }}
                    >
                        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    Adjust Stock for{" "}
                                    {adjustingStockItem?.item_name}
                                </DialogTitle>
                                <DialogDescription>
                                    Please use the + and - buttons in the item
                                    details page to adjust stock.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAdjustingStockItem(null);
                                        if (adjustingStockItem) {
                                            router.push(
                                                `/inventory/${adjustingStockItem.id}`
                                            );
                                        }
                                    }}
                                >
                                    Go to Item Details
                                </Button>
                            </div>
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
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will
                                permanently delete the selected{" "}
                                {Object.keys(rowSelection).length} item(s).
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Confirm Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirmation Dialog for Single Item Delete */}
                <Dialog
                    open={isDeleteSingleItemDialogOpen}
                    onOpenChange={setIsDeleteSingleItemDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the item
                                <span className="font-semibold">
                                    {` ${deletingItem?.item_name}`}
                                </span>
                                ? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeletingItem(null)} // Clear item on cancel
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={confirmSingleItemDelete} // Use new handler
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Delete Item
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

// --- Helper Functions ---

const getDensityPadding = (density: string) => {
    switch (density) {
        case "compact":
            return "py-1 px-2 text-xs";
        case "comfortable":
            return "py-3 px-2";
        case "normal":
        default:
            return "py-2 px-2";
    }
};
