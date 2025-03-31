// src/app/(authenticated)/inventory/_components/stock-transaction-history.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    // CardDescription, // Less needed now
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
    ArrowUpDown,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Download,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    PackageSearch, // Icon for empty state
    X,
    AlertCircle, // Icon for clearing filters
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"; // For filter popover
import { Label } from "@/components/ui/label"; // For filter popover
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    type SortingState,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce"; // Import debounce hook

// Type for stock transaction (assuming it's the same)
type StockTransaction = {
    id: string;
    item_id: string;
    transaction_type: string;
    quantity_change: number;
    reason: string | null;
    created_at: string;
    user_id: string | null;
    notes: string | null;
    user_name?: string;
    purchase_price: number | null;
    selling_price: number | null;
    total_price: number | null;
    reference_number: string | null;
};

// Function to fetch stock transactions (assuming it's the same)
async function getStockTransactions(
    itemId: string
): Promise<StockTransaction[]> {
    const response = await fetch(`/api/inventory/items/${itemId}/transactions`);
    if (!response.ok) {
        throw new Error("Failed to fetch stock transactions");
    }
    return response.json();
}

// Helper to get friendly names for transaction types
const getTransactionTypeFriendlyName = (type: string): string => {
    let displayName = type.charAt(0).toUpperCase() + type.slice(1);
    displayName = displayName.replace(/-/g, " "); // Replace hyphens
    return displayName;
};

// Available transaction types for filtering
const ALL_TRANSACTION_TYPES = [
    "purchase",
    "return",
    "inventory-correction-add",
    "other-addition",
    "sale",
    "damaged",
    "loss",
    "expired",
    "inventory-correction-remove",
    "other-removal",
];

interface StockTransactionHistoryProps {
    itemId: string;
    itemName: string;
}

export default function StockTransactionHistory({
    itemId,
    itemName,
}: StockTransactionHistoryProps) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: "created_at", desc: true },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300); // Debounce search input

    // Fetch stock transactions
    const {
        data: transactions = [],
        isLoading,
        isError,
        error, // Keep error object
        refetch,
    } = useQuery({
        queryKey: ["stockTransactions", itemId],
        queryFn: () => getStockTransactions(itemId),
    });

    // Define columns for the transaction table
    const columns: ColumnDef<StockTransaction>[] = useMemo(
        () => [
            {
                accessorKey: "transaction_type",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-1 py-0 h-auto -ml-1"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Type{" "}
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/70" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const type = row.getValue("transaction_type") as string;
                    const displayName = getTransactionTypeFriendlyName(type);

                    // Use CVA or similar for more complex styling if needed
                    const getTypeStyles = (type: string) => {
                        if (
                            [
                                "purchase",
                                "return",
                                "inventory-correction-add",
                                "other-addition",
                            ].includes(type)
                        )
                            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
                        if (["sale"].includes(type))
                            return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
                        if (
                            [
                                "damaged",
                                "loss",
                                "expired",
                                "inventory-correction-remove",
                                "other-removal",
                            ].includes(type)
                        )
                            return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";
                        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
                    };

                    return (
                        <Badge
                            variant="outline" // Use outline as base
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles(
                                type
                            )}`}
                        >
                            {displayName}
                        </Badge>
                    );
                },
                filterFn: (row, id, value: string[]) => {
                    // Expecting array for filter value
                    return value.includes(row.getValue(id));
                },
                // enableColumnFilter: true, // Explicitly enable if needed? Tanstack usually does by default
            },
            {
                accessorKey: "quantity_change",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-1 py-0 h-auto -ml-1"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Quantity{" "}
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/70" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const change = row.getValue("quantity_change") as number;
                    const isIncrease = change > 0;
                    const formatted = Math.abs(change).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 0, maximumFractionDigits: 2 }
                    ); // Dynamic decimals
                    return (
                        <div className="flex items-center font-medium">
                            {isIncrease ? (
                                <ArrowUp className="mr-1.5 h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                                <ArrowDown className="mr-1.5 h-3.5 w-3.5 text-rose-500 shrink-0" />
                            )}
                            <span
                                className={
                                    isIncrease
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                }
                            >
                                {isIncrease ? "+" : "-"}
                                {formatted}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "purchase_price", // Can represent either purchase or selling based on context
                header: "Unit Price",
                cell: ({ row }) => {
                    const transaction = row.original;
                    const price =
                        transaction.purchase_price ?? transaction.selling_price;
                    if (price === null || price === undefined)
                        return (
                            <span className="text-muted-foreground text-sm">
                                —
                            </span>
                        );

                    const formatCurrency = (value: number) =>
                        new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                        }).format(value);
                    return (
                        <div className="text-sm font-mono">
                            {formatCurrency(price)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "total_price",
                header: "Total Amount",
                cell: ({ row }) => {
                    const totalPrice = row.original.total_price;
                    if (!totalPrice)
                        return (
                            <span className="text-muted-foreground text-sm">
                                —
                            </span>
                        );
                    const formatCurrency = (value: number) =>
                        new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                        }).format(value);
                    return (
                        <div className="text-sm font-mono font-medium">
                            {formatCurrency(totalPrice)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "reference_number",
                header: "Reference",
                cell: ({ row }) => {
                    const refNumber = row.original.reference_number;
                    if (!refNumber)
                        return (
                            <span className="text-muted-foreground text-sm">
                                —
                            </span>
                        );
                    return (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="secondary"
                                        className="font-mono text-xs truncate max-w-[100px] cursor-default"
                                    >
                                        #{refNumber}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{refNumber}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "created_at",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="px-1 py-0 h-auto -ml-1"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Date{" "}
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/70" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const date = new Date(row.getValue("created_at") as string);
                    return (
                        <div className="text-sm">
                            <div>{format(date, "MMM d, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">
                                {format(date, "h:mm a")}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "reason", // Combine reason and notes
                header: "Reason / Notes",
                cell: ({ row }) => {
                    const reason = row.original.reason;
                    const notes = row.original.notes;
                    const combined = [reason, notes]
                        .filter(Boolean)
                        .join(" • "); // Combine with a separator

                    if (!combined)
                        return (
                            <span className="text-muted-foreground text-sm italic">
                                —
                            </span>
                        );

                    return (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger className="text-left">
                                    <p className="text-sm max-w-[200px] truncate">
                                        {combined}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs whitespace-normal text-xs p-2">
                                    {reason && (
                                        <p className="font-medium">{reason}</p>
                                    )}
                                    {notes && (
                                        <p className={reason ? "mt-1" : ""}>
                                            {notes}
                                        </p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "user_name",
                header: "Recorded By",
                cell: ({ row }) => {
                    const userName = row.original.user_name || "System";
                    const initials =
                        userName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "SY";
                    return (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold shrink-0">
                                            {initials}
                                        </div>
                                        {/* Optionally hide name on small screens */}
                                        <span className="text-sm hidden sm:inline truncate max-w-[100px]">
                                            {userName}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{userName}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
        ],
        []
    ); // Empty dependency array as columns don't depend on external state here

    // Set up the table
    const table = useReactTable({
        data: transactions,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter: debouncedGlobalFilter, // Use debounced value for filtering
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        // onGlobalFilterChange: setGlobalFilter, // We handle this manually with debounce
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 10, // Default page size
            },
        },
    });

    // --- Filter Popover State & Logic ---
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
    const typeFilter =
        (table.getColumn("transaction_type")?.getFilterValue() as
            | string[]
            | undefined) ?? [];

    const handleTypeFilterChange = (
        type: string,
        checked: boolean | string
    ) => {
        const currentTypes = typeFilter;
        let newTypes: string[];
        if (checked) {
            newTypes = [...currentTypes, type];
        } else {
            newTypes = currentTypes.filter((t) => t !== type);
        }
        table
            .getColumn("transaction_type")
            ?.setFilterValue(newTypes.length > 0 ? newTypes : undefined);
    };

    const clearAllFilters = () => {
        table.resetColumnFilters();
        setGlobalFilter("");
        setFilterPopoverOpen(false); // Close popover after clearing
    };
    const hasActiveFilters = columnFilters.length > 0 || globalFilter !== "";

    // --- Loading & Error States ---
    if (isLoading) {
        return (
            <Card className="shadow-sm border-border/60">
                <CardHeader>
                    {/* Skeleton for header */}
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    {/* Skeleton for controls */}
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                    {/* Skeleton for table */}
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    {/* Skeleton for pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="shadow-sm border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-lg text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" /> Error Loading
                        History
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center py-10">
                    <p className="text-destructive mb-4">
                        Failed to load transaction history. {error?.message}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <Card className="shadow-sm border-border/60">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <CardTitle className="text-lg">
                            Transaction History
                            <span className="text-muted-foreground font-medium text-base ml-2">
                                ({itemName})
                            </span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                            onClick={() => refetch()}
                            title="Refresh data"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Refresh data</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4 py-3 border-b">
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
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filter
                                        {typeFilter.length > 0 && (
                                            <>
                                                <Separator
                                                    orientation="vertical"
                                                    className="mx-2 h-4"
                                                />
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-sm px-1 font-normal"
                                                >
                                                    {typeFilter.length} active
                                                </Badge>
                                            </>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-64 p-0"
                                    align="start"
                                >
                                    <div className="p-4 space-y-4">
                                        <h4 className="font-medium leading-none">
                                            Filter by Type
                                        </h4>
                                        <div className="space-y-2">
                                            {ALL_TRANSACTION_TYPES.map(
                                                (type) => (
                                                    <div
                                                        key={type}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`filter-${type}`}
                                                            checked={typeFilter.includes(
                                                                type
                                                            )}
                                                            onCheckedChange={(
                                                                checked
                                                            ) =>
                                                                handleTypeFilterChange(
                                                                    type,
                                                                    checked
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`filter-${type}`}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {getTransactionTypeFriendlyName(
                                                                type
                                                            )}
                                                        </Label>
                                                    </div>
                                                )
                                            )}
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

                            <Select
                                value={table
                                    .getState()
                                    .pagination.pageSize.toString()}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger
                                    className="h-9 w-[110px]"
                                    size="sm"
                                >
                                    <SelectValue placeholder="Rows" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 rows</SelectItem>
                                    <SelectItem value="20">20 rows</SelectItem>
                                    <SelectItem value="50">50 rows</SelectItem>
                                    <SelectItem value="100">
                                        100 rows
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Right Side: Search & Export */}
                        <div className="flex gap-2 items-center w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={globalFilter} // Use non-debounced value for input display
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
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                title="Export data"
                            >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Export data</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="px-3 py-2 text-xs h-auto font-semibold text-muted-foreground uppercase tracking-wider"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
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
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                            className="hover:bg-muted/30" // Slightly subtler hover
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="px-3 py-2.5 align-top"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                                <PackageSearch className="h-12 w-12 text-muted-foreground/50" />
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        No Transactions Found
                                                    </p>
                                                    <p className="text-sm">
                                                        {hasActiveFilters
                                                            ? "Try adjusting your filters."
                                                            : "There are no stock changes recorded yet."}
                                                    </p>
                                                </div>
                                                {hasActiveFilters && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={
                                                            clearAllFilters
                                                        }
                                                    >
                                                        Clear Filters
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
                            Showing{" "}
                            {table.getRowModel().rows.length > 0
                                ? table.getState().pagination.pageIndex *
                                      table.getState().pagination.pageSize +
                                  1
                                : 0}
                            -
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) *
                                    table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{" "}
                            of {table.getFilteredRowModel().rows.length}{" "}
                            transaction(s)
                            {hasActiveFilters &&
                                ` (filtered from ${transactions.length} total)`}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous page</span>
                            </Button>
                            <span className="text-sm font-medium px-2">
                                Page {table.getState().pagination.pageIndex + 1}{" "}
                                of {table.getPageCount() || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next page</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
