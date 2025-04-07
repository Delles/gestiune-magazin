// src/app/(authenticated)/inventory/_components/inventory-list.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Trash2, Loader2, Inbox } from "lucide-react";
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

// --- Import Child Components ---
import { columns } from "./inventory-columns";
import { InventoryTableToolbar } from "./inventory-table-toolbar"; // Add import
import { InventoryBulkActions } from "./inventory-bulk-actions";
import { InventoryTablePagination } from "./inventory-table-pagination";
import { format as formatDate, parseISO } from "date-fns"; // Import date-fns functions
import { ro } from "date-fns/locale"; // Import Romanian locale
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

    // Dialog/Sheet/Popover states
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [adjustingStockItem, setAdjustingStockItem] =
        useState<InventoryItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const [reorderPointItemId, setReorderPointItemId] = useState<string | null>(
        null
    );

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

    // --- Table Instance ---
    const table = useReactTable({
        data: inventoryItems,
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
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        initialState: { pagination: { pageSize: 10 } },
    });
    // --- End Table Instance ---

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
        router.push("/inventory"); // Navigate to clear URL params
    };

    const activeFilterCount = table.getState().columnFilters.length;
    const hasActiveFilters = activeFilterCount > 0 || globalFilter !== "";
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

    const handleExportCsv = () => {
        const rows = table.getFilteredRowModel().rows; // Get filtered/sorted rows
        if (!rows.length) {
            toast.info("No data available to export.");
            return;
        }

        const formatRoDate = (dateString: string | null): string => {
            if (!dateString) return "";
            try {
                const date = parseISO(dateString);
                return formatDate(date, "dd.MM.yyyy HH:mm:ss", { locale: ro });
            } catch (error) {
                console.error("Error formatting date:", dateString, error);
                return dateString; // Return original string on error
            }
        };

        const headers = [
            "ID",
            "Item Name",
            "Category",
            "Unit",
            "Stock Quantity",
            "Reorder Point",
            "Selling Price",
            "Avg. Purchase Price",
            "Last Purchase Price",
            "Description",
            "Created At",
            "Updated At",
        ];

        // Use visible columns to potentially influence export?
        // For simplicity, exporting a standard set for now.
        const data = rows.map((row) => {
            const item = row.original;
            return [
                item.id,
                `"${item.item_name.replace(/"/g, '""')}"`, // Escape quotes
                item.category_name || "Uncategorized",
                item.unit,
                item.stock_quantity,
                item.reorder_point ?? "", // Handle null
                item.selling_price,
                item.average_purchase_price ?? "", // Handle null
                item.last_purchase_price ?? "", // Handle null
                `"${(item.description || "").replace(/"/g, '""')}"`, // Escape quotes
                formatRoDate(item.created_at), // Format date
                formatRoDate(item.updated_at), // Format date
            ].join(",");
        });

        const csvContent = [headers.join(","), ...data].join("\n");

        // Create CSV file and trigger download
        try {
            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            link.setAttribute("download", `inventory_export_${timestamp}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("CSV export started successfully.");
        } catch (error) {
            console.error("CSV Export Error:", error);
            toast.error("Failed to export data as CSV.");
        }
    };

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
            <div className="space-y-4">
                <InventoryTableToolbar
                    table={table}
                    categories={categories}
                    density={density}
                    handleDensityChange={handleDensityChange}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    clearAllFilters={clearAllFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    isAddSheetOpen={isAddSheetOpen}
                    setIsAddSheetOpen={setIsAddSheetOpen}
                    filterPopoverOpen={filterPopoverOpen}
                    setFilterPopoverOpen={setFilterPopoverOpen}
                    handleCategoryFilterChange={handleCategoryFilterChange}
                    handleStockFilterChange={handleStockFilterChange}
                    onExportCsv={handleExportCsv}
                />

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
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => {
                                    const isEditing =
                                        row.original.id === editingRowId;
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
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Inbox className="h-10 w-10 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                No items found.
                                            </p>
                                            <p className="text-sm">
                                                Add your first inventory item to
                                                get started.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

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
