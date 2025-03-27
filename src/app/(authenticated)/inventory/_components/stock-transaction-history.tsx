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
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
    CalendarIcon,
    ArrowUpDown,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Download,
    RefreshCw,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type for stock transaction
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

// Function to fetch stock transactions
async function getStockTransactions(
    itemId: string
): Promise<StockTransaction[]> {
    const response = await fetch(`/api/inventory/items/${itemId}/transactions`);
    if (!response.ok) {
        throw new Error("Failed to fetch stock transactions");
    }
    return response.json();
}

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
    const [activeTab, setActiveTab] = useState("all");

    // Fetch stock transactions
    const {
        data: transactions = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["stockTransactions", itemId],
        queryFn: () => getStockTransactions(itemId),
    });

    // Define columns for the transaction table
    const columns: ColumnDef<StockTransaction>[] = [
        {
            accessorKey: "transaction_type",
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        <span className="font-medium">Type</span>
                        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                </div>
            ),
            cell: ({ row, table }) => {
                const type = row.getValue("transaction_type") as string;

                // Custom styling based on transaction type
                const getTypeStyles = (type: string) => {
                    // Addition types
                    if (
                        [
                            "purchase",
                            "return",
                            "inventory-correction-add",
                            "other-addition",
                        ].includes(type)
                    ) {
                        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200";
                    }
                    // Reduction types
                    else if (["sale"].includes(type)) {
                        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
                    }
                    // Negative types
                    else if (
                        [
                            "damaged",
                            "loss",
                            "expired",
                            "inventory-correction-remove",
                            "other-removal",
                        ].includes(type)
                    ) {
                        return "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200";
                    }
                    return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
                };

                // Get friendly name for display
                let displayName = type.charAt(0).toUpperCase() + type.slice(1);
                // Replace hyphens with spaces
                displayName = displayName.replace(/-/g, " ");

                return (
                    <button
                        onClick={() => {
                            // Get current filter value
                            const currentFilter = table
                                .getColumn("transaction_type")
                                ?.getFilterValue() as string[] | undefined;

                            // If already filtered by this type, clear the filter
                            if (
                                currentFilter &&
                                currentFilter.length === 1 &&
                                currentFilter[0] === type
                            ) {
                                table
                                    .getColumn("transaction_type")
                                    ?.setFilterValue(undefined);
                            }
                            // Otherwise, set filter to this type
                            else {
                                table
                                    .getColumn("transaction_type")
                                    ?.setFilterValue([type]);
                            }
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${getTypeStyles(
                            type
                        )}`}
                    >
                        {displayName}
                    </button>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "quantity_change",
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        <span className="font-medium">Quantity</span>
                        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const change = row.getValue("quantity_change") as number;
                const formatted = Math.abs(change).toFixed(2);
                return (
                    <div className="flex items-center">
                        {change > 0 ? (
                            <ArrowUp className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            <ArrowDown className="mr-1 h-3.5 w-3.5 text-rose-500" />
                        )}
                        <span
                            className={
                                change > 0
                                    ? "text-emerald-600 font-medium"
                                    : "text-rose-600 font-medium"
                            }
                        >
                            {formatted}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "purchase_price",
            header: "Unit Price",
            cell: ({ row }) => {
                const transaction = row.original;
                const purchasePrice = transaction.purchase_price;
                const sellingPrice = transaction.selling_price;

                if (!purchasePrice && !sellingPrice) {
                    return (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    );
                }

                const formatCurrency = (value: number | null | undefined) => {
                    if (value === null || value === undefined) return "";
                    return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(value);
                };

                return (
                    <div className="font-medium">
                        {formatCurrency(purchasePrice || sellingPrice)}
                    </div>
                );
            },
        },
        {
            accessorKey: "total_price",
            header: "Total Amount",
            cell: ({ row }) => {
                const totalPrice = row.original.total_price;

                if (!totalPrice) {
                    return (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    );
                }

                const formatCurrency = (value: number | null | undefined) => {
                    if (value === null || value === undefined) return "";
                    return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(value);
                };

                return (
                    <div className="font-medium">
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

                if (!refNumber) {
                    return (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    );
                }

                return (
                    <div className="text-xs font-medium bg-muted px-2 py-1 rounded inline-block">
                        {refNumber}
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        <span className="font-medium">Date</span>
                        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at") as string);
                return (
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                            <div>{format(date, "MMM d, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">
                                {format(date, "h:mm a")}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "reason",
            header: "Reason/Notes",
            cell: ({ row }) => {
                const reason = row.getValue("reason") as string | null;
                const notes = row.original.notes;

                if (!reason && !notes)
                    return (
                        <span className="text-muted-foreground italic text-sm">
                            None
                        </span>
                    );

                return (
                    <div
                        className="max-w-[200px] truncate"
                        title={`${reason || ""} ${notes || ""}`}
                    >
                        {reason && <div className="font-medium">{reason}</div>}
                        {notes && (
                            <div className="text-sm text-muted-foreground truncate">
                                {notes}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "user_name",
            header: "Recorded By",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mr-2">
                            {(row.original.user_name || "System").charAt(0)}
                        </div>
                        <span>{row.original.user_name || "System"}</span>
                    </div>
                );
            },
        },
    ];

    // Filter transactions based on active tab
    const filteredTransactions = useMemo(() => {
        if (activeTab === "all") return transactions;
        if (activeTab === "additions")
            return transactions.filter((tx) => tx.quantity_change > 0);
        if (activeTab === "reductions")
            return transactions.filter((tx) => tx.quantity_change < 0);
        return transactions;
    }, [activeTab, transactions]);

    // Set up the table
    const table = useReactTable({
        data: filteredTransactions,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 5,
            },
        },
    });

    if (isLoading) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center">
                        <span>Stock Transaction History</span>
                        <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    </CardTitle>
                    <CardDescription>
                        Loading transactions for {itemName}...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex gap-2 mb-4">
                            <Skeleton className="h-9 w-[180px]" />
                            <Skeleton className="h-9 w-[180px]" />
                            <Skeleton className="h-9 w-full ml-auto" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <div className="flex justify-end gap-2 mt-4">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">
                        Stock Transaction History
                    </CardTitle>
                    <CardDescription>
                        Failed to load transaction history
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-red-50 text-red-500 p-3 rounded-md">
                        <p>
                            There was an error loading the transaction history.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="mt-2"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-md">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">
                            Stock Transaction History
                        </CardTitle>
                        <CardDescription>
                            History of stock changes for{" "}
                            <span className="font-medium">{itemName}</span>
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => refetch()}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh data</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export data</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="mb-6"
                >
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="all">All Transactions</TabsTrigger>
                        <TabsTrigger value="additions">
                            Stock Additions
                        </TabsTrigger>
                        <TabsTrigger value="reductions">
                            Stock Reductions
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm">
                            {table
                                .getColumn("transaction_type")
                                ?.getFilterValue() ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                        Filtered by type:
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() =>
                                            table
                                                .getColumn("transaction_type")
                                                ?.setFilterValue(undefined)
                                        }
                                    >
                                        Clear filter
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
                        <div className="flex flex-wrap gap-2 items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9"
                                    >
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filter
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[200px]"
                                >
                                    <DropdownMenuItem
                                        onClick={() =>
                                            table
                                                .getColumn("transaction_type")
                                                ?.setFilterValue([
                                                    "purchase",
                                                    "return",
                                                    "inventory-correction-add",
                                                    "other-addition",
                                                ])
                                        }
                                    >
                                        Show only additions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            table
                                                .getColumn("transaction_type")
                                                ?.setFilterValue([
                                                    "sale",
                                                    "damaged",
                                                    "loss",
                                                    "expired",
                                                    "inventory-correction-remove",
                                                    "other-removal",
                                                ])
                                        }
                                    >
                                        Show only reductions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            table
                                                .getColumn("transaction_type")
                                                ?.setFilterValue(undefined)
                                        }
                                    >
                                        Clear filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Select
                                value={table
                                    .getState()
                                    .pagination.pageSize.toString()}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-9 w-[110px]">
                                    <SelectValue placeholder="Rows" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 rows</SelectItem>
                                    <SelectItem value="10">10 rows</SelectItem>
                                    <SelectItem value="20">20 rows</SelectItem>
                                    <SelectItem value="50">50 rows</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="text-sm text-muted-foreground">
                                Showing{" "}
                                {table.getFilteredRowModel().rows.length} of{" "}
                                {transactions.length} transactions
                            </div>
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={globalFilter ?? ""}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="pl-9 h-9 w-full sm:w-[250px] lg:w-[300px]"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="font-medium"
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
                                    table.getRowModel().rows.map((row, i) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                            className={
                                                i % 2 === 0 ? "bg-muted/20" : ""
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
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
                                            className="h-24 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <div className="rounded-full bg-muted p-3 mb-2">
                                                    <Search className="h-6 w-6" />
                                                </div>
                                                <p>
                                                    No transaction history
                                                    found.
                                                </p>
                                                <p className="text-sm">
                                                    Try adjusting your filters
                                                    or search terms.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
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
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
