import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    SortingState,
    ColumnFiltersState,
    RowSelectionState,
    VisibilityState,
    PaginationState,
    Row,
} from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce";
import type { Tables } from "@/types/supabase"; // Added Supabase types import
import { columns as defaultColumns } from "@/app/(authenticated)/inventory/_components/list/inventory-columns"; // Import columns definition

// Define the extended type matching the data structure used in the table
export type InventoryItemWithCategoryName = Tables<"InventoryItems"> & {
    category_name: string | null; // Assuming API/data hook provides this
};

export type Density = "compact" | "normal" | "comfortable";
export type StockValueRangeFilter = { min: number | null; max: number | null };
export type ReorderPointFilter = boolean | null; // true = has reorder point, null = any

interface UseInventoryTableProps {
    inventoryItems: InventoryItemWithCategoryName[]; // Updated type
    categories: Tables<"categories">[]; // Updated type
    deleteMutationIsPending: boolean; // Pass mutation state for disabling actions
    updateReorderPointMutationIsPending: boolean;
}

export function useInventoryTable({
    inventoryItems,
    categories,
    deleteMutationIsPending,
    updateReorderPointMutationIsPending,
}: UseInventoryTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10, // Default page size, adjust as needed
    });
    const [density, setDensity] = useState<Density>("normal");

    // Custom Filter State
    const [stockValueRange, setStockValueRange] =
        useState<StockValueRangeFilter>({ min: null, max: null });
    const [reorderPointFilter, setReorderPointFilter] =
        useState<ReorderPointFilter>(null);

    // UI State (Dialogs, Editing, Popovers)
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [adjustingStockItem, setAdjustingStockItem] =
        useState<InventoryItemWithCategoryName | null>(null); // Updated type
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleteSingleItemDialogOpen, setIsDeleteSingleItemDialogOpen] =
        useState(false);
    const [deletingItem, setDeletingItem] =
        useState<InventoryItemWithCategoryName | null>(null); // Updated type
    const [reorderPointItemId, setReorderPointItemId] = useState<string | null>(
        null
    ); // For the popover trigger
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

    // --- Effects ---

    // Load persisted state (Density & Visibility)
    useEffect(() => {
        const savedDensity = localStorage.getItem(
            "inventoryTableDensity"
        ) as Density | null;
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

    // Sync stock quantity filter with URL ('low_stock', 'out_of_stock')
    useEffect(() => {
        const statusFilterValueFromUrl = searchParams.get("status");
        setColumnFilters((prev) => {
            const otherFilters = prev.filter((f) => f.id !== "stock_quantity");
            if (
                statusFilterValueFromUrl === "low_stock" ||
                statusFilterValueFromUrl === "out_of_stock"
            ) {
                return [
                    ...otherFilters,
                    { id: "stock_quantity", value: [statusFilterValueFromUrl] },
                ];
            }
            return otherFilters;
        });
    }, [searchParams]);

    // --- Handlers ---

    // Persist density on change
    const handleDensityChange = useCallback((newDensity: Density) => {
        setDensity(newDensity);
        localStorage.setItem("inventoryTableDensity", newDensity);
    }, []);

    // Persist visibility on change
    const handleVisibilityChange = useCallback(
        (updater: React.SetStateAction<VisibilityState>) => {
            const newState =
                typeof updater === "function"
                    ? updater(columnVisibility)
                    : updater;
            setColumnVisibility(newState);
            localStorage.setItem(
                "inventoryTableVisibility",
                JSON.stringify(newState)
            );
        },
        [columnVisibility]
    );

    // Custom Filter Handlers
    const handleStockValueRangeChange = useCallback(
        (type: "min" | "max", value: string) => {
            const numericValue = value === "" ? null : parseFloat(value);
            setStockValueRange((prev) => ({
                ...prev,
                [type]: numericValue,
            }));
        },
        []
    );

    const handleReorderPointFilterChange = useCallback((checked: boolean) => {
        setReorderPointFilter(checked ? true : null);
    }, []);

    // --- Handlers that DO NOT depend on the table instance ---
    // Move these back before useReactTable
    const clearAllFilters = useCallback(() => {
        setColumnFilters([]);
        setGlobalFilter("");
        setStockValueRange({ min: null, max: null });
        setReorderPointFilter(null);
        router.push("/inventory");
    }, [router]);

    const handleEditClick = useCallback((itemId: string) => {
        setEditingRowId(itemId);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingRowId(null);
    }, []);

    const handleSaveEdit = useCallback(() => {
        setEditingRowId(null);
    }, []);

    const handleDeleteSelected = useCallback(() => {
        setIsDeleteDialogOpen(true);
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
    }, []);

    const handleDeleteItemClick = useCallback(
        (item: InventoryItemWithCategoryName) => {
            setDeletingItem(item);
            setIsDeleteSingleItemDialogOpen(true);
        },
        []
    );

    const closeSingleItemDeleteDialog = useCallback(() => {
        setIsDeleteSingleItemDialogOpen(false);
        setDeletingItem(null);
    }, []);

    const openStockAdjustmentDialog = useCallback(
        (item: InventoryItemWithCategoryName | null) => {
            setAdjustingStockItem(item);
        },
        []
    );

    const closeStockAdjustmentDialog = useCallback(() => {
        setAdjustingStockItem(null);
    }, []);

    // --- Table Instance Initialization ---
    const table = useReactTable<InventoryItemWithCategoryName>({
        data: inventoryItems,
        columns: defaultColumns, // Use imported columns
        state: {
            sorting,
            columnFilters,
            globalFilter: debouncedGlobalFilter,
            rowSelection,
            columnVisibility,
            pagination,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: handleVisibilityChange, // Use the persisting handler
        onPaginationChange: setPagination,
        initialState: { pagination: { pageSize: 10 } }, // Default page size
        onGlobalFilterChange: setGlobalFilter,
        autoResetPageIndex: false,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        // Pass meta for actions (can be used in column definitions)
        meta: {
            categories: categories,
            handleEditClick: handleEditClick,
            handleSaveEdit: handleSaveEdit,
            handleCancelEdit: handleCancelEdit,
            setAdjustingStockItem: openStockAdjustmentDialog,
            setReorderPointItemId: setReorderPointItemId,
            handleDeleteItemClick: handleDeleteItemClick,
            updateReorderPointMutationIsPending:
                updateReorderPointMutationIsPending,
            editingRowId: editingRowId,
            reorderPointItemId: reorderPointItemId,
            density: density,
        },
    });

    // --- Handlers Defined AFTER table instance is created ---
    // These handlers depend on `table`
    const handleCategoryFilterChange = useCallback(
        (categoryId: string, checked: boolean | string) => {
            if (!table) return; // Check if table is defined
            const category = categories.find((c) => c.id === categoryId);
            if (!category) return;
            const categoryName = category.name;

            const currentFilterValue = (table
                .getColumn("category_name")
                ?.getFilterValue() ?? []) as string[];

            let newValues: string[];
            if (checked) {
                newValues = [...currentFilterValue, categoryName];
            } else {
                newValues = currentFilterValue.filter(
                    (name) => name !== categoryName
                );
            }
            table
                .getColumn("category_name")
                ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
        },
        [categories, table] // Dependency: categories and the table object
    );

    const handleStockFilterChange = useCallback(
        (statusValue: string, checked: boolean | string) => {
            if (!table) return; // Check if table is defined
            const currentFilterValue = (table
                .getColumn("stock_quantity")
                ?.getFilterValue() ?? []) as string[];

            let newValues: string[];
            if (checked) {
                newValues = [...currentFilterValue, statusValue];
            } else {
                newValues = currentFilterValue.filter(
                    (val) => val !== statusValue
                );
            }
            table
                .getColumn("stock_quantity")
                ?.setFilterValue(newValues.length > 0 ? newValues : undefined);
        },
        [table] // Dependency: the table object
    );

    // --- Post-Filtering for Custom Logic ---
    const tanstackFilteredRows = table.getFilteredRowModel().rows;

    const finalFilteredRows = useMemo(() => {
        return tanstackFilteredRows.filter(
            (row: Row<InventoryItemWithCategoryName>) => {
                const item = row.original;

                // Stock Value Filter
                const stockValue =
                    (item.stock_quantity ?? 0) *
                    (item.average_purchase_price ?? 0);
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
                // Add logic for reorderPointFilter === false if needed (e.g., show only items *without* a reorder point)
                // if (reorderPointFilter === false && item.reorder_point !== null && item.reorder_point !== undefined) return false;

                return true; // Item passes all custom filters
            }
        );
    }, [tanstackFilteredRows, stockValueRange, reorderPointFilter]);

    // --- Calculated Values ---
    const totalInventoryValue = useMemo(() => {
        return finalFilteredRows.reduce(
            (sum: number, row: Row<InventoryItemWithCategoryName>) => {
                const quantity = row.original.stock_quantity ?? 0;
                const avgPrice = row.original.average_purchase_price ?? 0;
                return sum + quantity * avgPrice;
            },
            0
        );
    }, [finalFilteredRows]);

    // --- Filter Values for Toolbar ---
    // These are derived from the table state for convenience in the Toolbar component
    // Extract columnFilters from state to satisfy exhaustive-deps
    // const { columnFilters: tableColumnFilters } = table.getState(); // Removed as unnecessary dependency

    // --- Effects (Post-Table Initialization) ---

    // Effect to reset page index when filters/data change the page count
    useEffect(() => {
        // Ensure table instance is available (needed for getPageCount)
        if (!table) return;

        const pageCount = table.getPageCount(); // Get the total number of pages based on current filter/data
        const currentPageIndex = pagination.pageIndex;

        // console.log(`Pagination Effect Check: Current Index: ${currentPageIndex}, Page Count: ${pageCount}`);

        if (pageCount > 0 && currentPageIndex >= pageCount) {
            // console.log(`Resetting page index from ${currentPageIndex} to 0 (out of bounds) via setPagination`);
            // Reset to the first page if the current index is out of bounds
            // Use the state setter instead of directly calling table method
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        } else if (pageCount === 0 && currentPageIndex !== 0) {
            // console.log(`Resetting page index from ${currentPageIndex} to 0 (no pages) via setPagination`);
            // If there are no pages (e.g., no results after filtering), reset index to 0
            // Use the state setter instead of directly calling table method
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }

        // Dependencies: The table instance (for getPageCount), the controlled page index state,
        // and the state setter function itself.
    }, [table, pagination.pageIndex, setPagination]); // Added setPagination to dependencies

    // ---- Side Effects Dependent on Table Instance ----

    // Remove the useEffect hook that assigned the now-removed tableInstance
    // useEffect(() => {
    //     tableInstance = table;
    //     return () => {
    //         tableInstance = null;
    //     };
    // }, [table]);

    // Apply custom filters to the table data - This useEffect is likely redundant now
    useEffect(() => {
        // Ensure table instance is available
        if (!table) return;

        // We can potentially remove this useEffect entirely if its only purpose was
        // to push these custom filters into columnFilters state, as the manual
        // filtering in useMemo(finalFilteredRows) handles it.
        // For now, let's just comment out the setColumnFilters call.
    }, [stockValueRange, reorderPointFilter, table]); // Rerun when custom filters or table change

    // --- Return Value ---

    return {
        table,
        finalFilteredRows, // Use this for rendering the table body
        totalInventoryValue,

        // State and Setters for UI Control
        density,
        handleDensityChange,
        globalFilter,
        setGlobalFilter,
        filterPopoverOpen,
        setFilterPopoverOpen,
        rowSelection, // Needed for bulk actions bar visibility
        editingRowId,
        handleEditClick,
        handleCancelEdit,
        handleSaveEdit,

        // Custom Filters State & Handlers
        stockValueRange,
        reorderPointFilter,
        handleStockValueRangeChange,
        handleReorderPointFilterChange,

        // Standard Filter Handlers
        handleCategoryFilterChange,
        handleStockFilterChange,
        clearAllFilters,

        // Dialog/Popover State & Control
        isDeleteDialogOpen,
        handleDeleteSelected,
        closeDeleteDialog,
        isDeleteSingleItemDialogOpen,
        deletingItem,
        handleDeleteItemClick,
        closeSingleItemDeleteDialog,
        adjustingStockItem,
        openStockAdjustmentDialog,
        closeStockAdjustmentDialog,

        // Reorder Point Popover Control
        reorderPointItemId,
        setReorderPointItemId,

        // Loading states passed through
        deleteMutationIsPending,
        updateReorderPointMutationIsPending,

        // Derived/Computed Values
        pagination,
        setPagination,
        selectedRowCount: finalFilteredRows.length,
        hasSelectedRows: finalFilteredRows.length > 0,
        canDeleteSelected:
            finalFilteredRows.length > 0 && !deleteMutationIsPending,
        isFiltered:
            columnFilters.length > 0 ||
            globalFilter !== "" ||
            stockValueRange.min !== null ||
            stockValueRange.max !== null ||
            reorderPointFilter !== null,
    };
}
