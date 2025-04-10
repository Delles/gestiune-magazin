// src/app/(authenticated)/inventory/_components/inventory-list.tsx
"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Row, flexRender } from "@tanstack/react-table";
import { format as formatDate, parseISO } from "date-fns"; // Re-added for potential use in export
import { ro } from "date-fns/locale"; // Re-added for potential use in export
import { saveAs } from "file-saver"; // Needed for CSV export

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { InventoryItem } from "../../types/types"; // Keep types

// Import Hooks
import { useInventoryData } from "@/hooks/use-inventory-data";
import { useInventoryTable } from "@/hooks/use-inventory-table";

// Import Child Components
import { InventoryTableToolbar } from "./inventory-table-toolbar";
import { InventoryBulkActions } from "./inventory-bulk-actions";
import { InventoryTablePagination } from "./inventory-table-pagination";
import InlineEditFormRow from "./inline-edit-form";
import DisplayRow from "./display-row";
import { toast } from "sonner"; // Import toast

// Helper function (can be moved to utils if used elsewhere)
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

export default function InventoryList() {
    const isMountedRef = useRef(false);
    const router = useRouter();
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // --- Data Fetching & Mutations ---
    const {
        inventoryItems,
        categories,
        isLoading,
        queryError,
        deleteMutation,
        updateReorderPointMutation,
    } = useInventoryData();

    // --- Table State & Logic ---
    const {
        table,
        finalFilteredRows, // Use this for rendering the table body
        totalInventoryValue,
        density,
        handleDensityChange,
        globalFilter,
        setGlobalFilter,
        rowSelection,
        editingRowId,
        handleEditClick,
        handleCancelEdit,
        stockValueRange,
        reorderPointFilter,
        handleStockValueRangeChange,
        handleReorderPointFilterChange,
        handleCategoryFilterChange,
        handleStockFilterChange,
        clearAllFilters,
        isDeleteDialogOpen,
        handleDeleteSelected, // Opens bulk delete dialog
        closeDeleteDialog,
        isDeleteSingleItemDialogOpen,
        deletingItem,
        handleDeleteItemClick, // Opens single delete dialog
        closeSingleItemDeleteDialog,
        adjustingStockItem,
        openStockAdjustmentDialog, // Opens adjustment info dialog
        closeStockAdjustmentDialog,
        reorderPointItemId,
        setReorderPointItemId,
    } = useInventoryTable({
        inventoryItems,
        categories,
        deleteMutationIsPending: deleteMutation.isPending,
        updateReorderPointMutationIsPending:
            updateReorderPointMutation.isPending,
    });

    // --- Deletion Handlers ---
    // Wrap mutation calls with dialog closing logic
    const confirmDeleteSelected = useCallback(() => {
        // Get the actual UUIDs from the selected rows' original data
        const selectedIds = table
            .getSelectedRowModel()
            .rows.map((row) => row.original.id); // <-- Correctly map to UUIDs

        if (selectedIds.length === 0) {
            toast.warning("No items selected for deletion.");
            closeDeleteDialog();
            return;
        }

        deleteMutation.mutate(selectedIds, {
            onSuccess: () => {
                if (!isMountedRef.current) return;
                closeDeleteDialog();
                table.resetRowSelection(); // Reset selection after successful bulk delete
            },
            onError: () => {
                if (!isMountedRef.current) return;
                closeDeleteDialog(); // Close dialog even on error
            },
        });
    }, [table, deleteMutation, closeDeleteDialog]);

    const confirmSingleItemDelete = useCallback(() => {
        if (deletingItem) {
            deleteMutation.mutate([deletingItem.id], {
                onSuccess: () => {
                    if (!isMountedRef.current) return;
                    closeSingleItemDeleteDialog();
                },
                onError: () => {
                    if (!isMountedRef.current) return;
                    closeSingleItemDeleteDialog(); // Close dialog even on error
                },
            });
        }
    }, [deletingItem, deleteMutation, closeSingleItemDeleteDialog]);

    // --- Reorder Point Save Handler ---
    const handleSaveReorderPoint = useCallback(
        (newPoint: number | null) => {
            if (reorderPointItemId) {
                updateReorderPointMutation.mutate(
                    {
                        id: reorderPointItemId,
                        reorder_point: newPoint,
                    },
                    {
                        onSuccess: () => {
                            if (!isMountedRef.current) return;
                            setReorderPointItemId(null); // Close popover on success
                        },
                        // onError handled globally by the hook (toast)
                        // Popover closure on error might depend on specific UX requirements
                    }
                );
            }
        },
        [reorderPointItemId, updateReorderPointMutation, setReorderPointItemId]
    );

    // --- Inline Edit Save Handler ---
    // TODO: Implement actual save logic for inline editing (needs API endpoint & mutation)
    const handleSaveEdit = useCallback(() => {
        // Currently just closes the edit form
        // Replace with mutation call when backend is ready
        // Example:
        // saveEditMutation.mutate(editedData, {
        //    onSuccess: () => setEditingRowId(null)
        // });
        console.log("Save Action Triggered for row:", editingRowId);
        toast.info("Save functionality for inline edit not yet implemented.");
        handleCancelEdit(); // Using handleCancelEdit from hook to close form for now
    }, [editingRowId, handleCancelEdit]); // Depend on editingRowId and handleCancelEdit

    // --- Export Handler ---
    // TODO: Reinstate and test export functionality - Implemented below
    const handleExportCsv = useCallback(() => {
        // Use finalFilteredRows from the hook which already applies custom filters
        const rowsToExport = finalFilteredRows;
        if (!rowsToExport.length) {
            toast.warning("No data to export based on current filters.");
            return;
        }

        // Define headers based on visible columns or a fixed set
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

        // Map the filtered rows to CSV format
        const data = rowsToExport.map((row) => {
            const item = row.original;
            const stockValue =
                (item.stock_quantity ?? 0) * (item.average_purchase_price ?? 0);
            // Ensure consistent order matching headers
            return [
                `"${item.id}"`,
                `"${item.item_name?.replace(/"/g, '""') ?? ""}"`, // Escape double quotes
                `"${item.category_name ?? "Uncategorized"}"`,
                item.stock_quantity ?? 0,
                `"${item.unit ?? ""}"`,
                item.average_purchase_price ?? 0,
                item.last_purchase_price ?? 0,
                item.selling_price ?? 0,
                stockValue,
                item.reorder_point ?? "N/A",
                `"${formatRoDate(item.created_at)}"`,
                `"${formatRoDate(item.updated_at)}"`,
            ].join(",");
        });

        const csvContent = [headers.join(","), ...data].join("\n");

        // Use FileSaver.js for reliable saving
        try {
            const blob = new Blob(["\uFEFF" + csvContent], {
                // Add BOM for Excel
                type: "text/csv;charset=utf-8;",
            });
            saveAs(
                blob,
                `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
            );
            toast.success("Data exported to CSV successfully.");
        } catch (error) {
            console.error("Error exporting CSV:", error);
            toast.error("Failed to export data to CSV.");
        }
    }, [finalFilteredRows]); // Depends on the currently filtered rows

    // --- Render Logic ---
    if (isLoading) {
        // Basic skeleton remains
        return (
            <div className="space-y-4 p-1">
                <Skeleton className="h-9 w-full" />{" "}
                {/* Placeholder for title/value */}
                <Skeleton className="h-12 w-full" />{" "}
                {/* Placeholder for Toolbar */}
                {/* Simplified skeleton for table rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
                <Skeleton className="h-9 w-full mt-4" />{" "}
                {/* Placeholder for Pagination */}
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

    return (
        <TooltipProvider>
            <div className={cn("space-y-4 p-1", density)}>
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

                <InventoryTableToolbar
                    table={table}
                    categories={categories}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    density={density}
                    handleDensityChange={handleDensityChange} // Pass the handler from the hook
                    stockValueRange={stockValueRange}
                    reorderPointFilter={reorderPointFilter}
                    handleStockValueRangeChange={handleStockValueRangeChange}
                    handleReorderPointFilterChange={
                        handleReorderPointFilterChange
                    }
                    handleCategoryFilterChange={handleCategoryFilterChange}
                    handleStockFilterChange={handleStockFilterChange}
                    clearAllFilters={clearAllFilters}
                    onExportCsv={handleExportCsv} // Pass export handler
                    isAddSheetOpen={isAddSheetOpen}
                    setIsAddSheetOpen={setIsAddSheetOpen}
                />

                <InventoryBulkActions
                    selectedRowCount={table.getSelectedRowModel().rows.length}
                    onDelete={handleDeleteSelected} // Use handler from hook to open dialog
                    isDeleting={deleteMutation.isPending}
                />

                <div className="rounded-md border overflow-hidden">
                    <Table data-density={density}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                getDensityPadding(density),
                                                {
                                                    // Use helper
                                                    "cursor-pointer select-none":
                                                        header.column.getCanSort(),
                                                    "w-[100px]":
                                                        header.id === "select", // Example fixed width
                                                    "w-[80px] text-right pr-3":
                                                        header.id === "actions", // Example fixed width
                                                }
                                            )}
                                            style={{
                                                width:
                                                    header.getSize() !== 150
                                                        ? header.getSize()
                                                        : undefined,
                                            }} // Apply column sizing if defined
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      // Use flexRender here
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                            {{
                                                // Add sorting indicator
                                                asc: " 🔼",
                                                desc: " 🔽",
                                            }[
                                                header.column.getIsSorted() as string
                                            ] ?? null}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {finalFilteredRows.length ? (
                                finalFilteredRows.map((row) => {
                                    const item = row.original;
                                    const isEditing = editingRowId === item.id;
                                    type TanStackRow = Row<InventoryItem>; // Keep type alias local if only used here

                                    if (isEditing) {
                                        return (
                                            <InlineEditFormRow
                                                key={`${row.id}-edit`}
                                                item={item} // Pass original item data
                                                categories={categories} // Pass categories needed for dropdown
                                                onSave={handleSaveEdit} // Use specific save handler
                                                onCancel={handleCancelEdit} // Use handler from hook
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
                                                router={router} // Pass router instance
                                                // Pass handlers directly from the component context/props
                                                setAdjustingStockItem={
                                                    openStockAdjustmentDialog
                                                } // Use handler from hook (accepts null)
                                                handleEditClick={
                                                    handleEditClick
                                                } // Use handler from hook
                                                reorderPointItemId={
                                                    reorderPointItemId
                                                } // Pass state from hook
                                                setReorderPointItemId={
                                                    setReorderPointItemId
                                                } // Pass state setter from hook
                                                handleSaveReorderPoint={
                                                    handleSaveReorderPoint
                                                } // Pass the save handler defined above
                                                isSavingReorderPoint={
                                                    updateReorderPointMutation.isPending
                                                } // Pass loading state
                                                handleDeleteItemClick={
                                                    handleDeleteItemClick
                                                } // Use handler from hook to open dialog
                                            />
                                        );
                                    }
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={table.getAllColumns().length} // Use dynamic column count
                                        className="h-24 text-center"
                                    >
                                        No results found matching your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <InventoryTablePagination table={table} />

                {/* Dialogs */}
                {/* Stock Adjustment Info Dialog */}
                {adjustingStockItem && (
                    <Dialog
                        open={!!adjustingStockItem}
                        onOpenChange={(open) => {
                            if (!open) closeStockAdjustmentDialog();
                        }}
                    >
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    Adjust Stock:{" "}
                                    {adjustingStockItem?.item_name}
                                </DialogTitle>
                                <DialogDescription>
                                    Stock adjustments are handled on the item
                                    details page.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="sm:justify-center">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        router.push(
                                            `/inventory/${adjustingStockItem.id}`
                                        );
                                        closeStockAdjustmentDialog();
                                    }}
                                >
                                    Go to Item Details
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeStockAdjustmentDialog}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Bulk Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) closeDeleteDialog();
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will
                                permanently delete the selected{" "}
                                {Object.keys(rowSelection).length} item(s).
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={closeDeleteDialog}
                                disabled={deleteMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDeleteSelected}
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

                {/* Single Item Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteSingleItemDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) closeSingleItemDeleteDialog();
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the item
                                <span className="font-semibold">{` ${deletingItem?.item_name}`}</span>
                                ? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={closeSingleItemDeleteDialog}
                                disabled={deleteMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmSingleItemDelete}
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
