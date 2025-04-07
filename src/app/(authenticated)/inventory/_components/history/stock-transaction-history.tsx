// src/app/(authenticated)/inventory/_components/history/stock-transaction-history.tsx
"use client";

import { useState, useMemo } from "react";
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
import {
    formatDate,
    formatCurrency,
    DEFAULT_DATETIME_FORMAT,
} from "@/lib/utils";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    PackageSearch, // Icon for empty state
    ListFilter, // For Type Filter Button
    FileDown, // For Export
    View, // For Columns
    FilterX, // For Clear Filters
    Settings2Icon, // For Density Toggle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import type { DateRange } from "react-day-picker"; // Import DateRange type
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup, // Added
    DropdownMenuRadioItem, // Added
} from "@/components/ui/dropdown-menu";
import { format, isWithinInterval } from "date-fns"; // Added date-fns functions
import { cn } from "@/lib/utils";
import { ro } from "date-fns/locale"; // Import Romanian locale for date formatting
import { toast } from "sonner"; // Correct toast import
import { Tables } from "@/types/supabase";
// START: Import Sheet components and new Sidebar
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { HistoryFilterSidebar } from "./history-filter-sidebar";
import { getTransactionTypeFriendlyName } from "./stock-transaction-history-helpers"; // Keep this one for CSV export
// END: Import Sheet components

// Helper to get friendly names for transaction types
// const getTransactionTypeFriendlyName = (type: string): string => {
//     let displayName = type.charAt(0).toUpperCase() + type.slice(1);
//     displayName = displayName.replace(/-/g, " "); // Replace hyphens
//     return displayName;
// };

// Available transaction types for filtering
// const ALL_TRANSACTION_TYPES = [
//     "purchase",
//     "return",
//     "inventory-correction-add",
//     "other-addition",
//     "sale",
//     "damaged",
//     "loss",
//     "expired",
//     "inventory-correction-remove",
//     "other-removal",
// ];

// Helper for CSV escaping (using unknown)
const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "";
    }
    const stringValue = String(value);
    if (/[,"\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

// Define density type
type Density = "compact" | "normal" | "comfortable";

// START: Update Props Interface
interface StockTransactionHistoryProps {
    itemId: string;
    itemName: string;
    currentStock: number; // Add current stock prop
    transactions: Tables<"StockTransactions">[]; // Add transactions prop with Supabase type
    unit: string; // Add unit prop
}
// END: Update Props Interface

// START: Define extended transaction type with balance
type TransactionWithBalance = Tables<"StockTransactions"> & {
    balance: number;
};
// END: Define extended transaction type

export default function StockTransactionHistory({
    itemName,
    currentStock,
    transactions: initialTransactions,
    unit,
}: StockTransactionHistoryProps) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: "created_at", desc: false },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined
    );
    const [referenceFilter, setReferenceFilter] = useState("");
    const debouncedReferenceFilter = useDebounce(referenceFilter, 300);

    // --- Add Density State ---
    const [density, setDensity] = useState<Density>("normal");

    // --- Calculate Running Balance --- START
    const transactionsWithBalance = useMemo(() => {
        // Sort initial transactions DESC to calculate backwards from current stock
        const sortedDesc = [...initialTransactions].sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );

        let runningBalance = currentStock; // Start from the known current stock
        const processed: TransactionWithBalance[] = [];

        // Iterate backwards through the DESC sorted transactions
        for (let i = 0; i < sortedDesc.length; i++) {
            const tx = sortedDesc[i];
            processed.push({ ...tx, balance: runningBalance });
            // To find the balance *before* this transaction, reverse its effect
            runningBalance -= tx.quantity_change;
        }

        // Reverse the processed array to display in chronological order (matching default sort)
        return processed.reverse();
    }, [initialTransactions, currentStock]);
    // --- Calculate Running Balance --- END

    // --- Filter state and calculation --- START
    // Get selected types from columnFilters state
    const selectedTypes = useMemo(() => {
        return (
            (columnFilters.find((f) => f.id === "transaction_type")?.value as
                | string[]
                | undefined) ?? []
        );
    }, [columnFilters]);

    // Filter calculated data (date range, reference, types, global)
    const filteredTransactions = useMemo(() => {
        let filtered = [...transactionsWithBalance]; // Start with calculated data

        // Apply Date Range Filter
        if (dateRange?.from && dateRange?.to) {
            filtered = filtered.filter((transaction) => {
                const transactionDate = new Date(transaction.created_at);
                try {
                    const fromDate = new Date(dateRange.from as Date);
                    fromDate.setHours(0, 0, 0, 0);
                    const toDate = new Date(dateRange.to as Date);
                    toDate.setHours(23, 59, 59, 999);
                    return isWithinInterval(transactionDate, {
                        start: fromDate,
                        end: toDate,
                    });
                } catch (e) {
                    console.error("Invalid date for filtering:", e);
                    return false;
                }
            });
        } else if (dateRange?.from) {
            // Handle single date selection
            filtered = filtered.filter((transaction) => {
                try {
                    const transactionDate = new Date(transaction.created_at);
                    const fromDate = new Date(dateRange.from as Date);
                    fromDate.setHours(0, 0, 0, 0);
                    return (
                        transactionDate.toDateString() ===
                        fromDate.toDateString()
                    );
                } catch (e) {
                    console.error("Invalid date for filtering:", e);
                    return false;
                }
            });
        }

        // Apply Reference Filter (Debounced)
        if (debouncedReferenceFilter) {
            const lowerCaseRefFilter = debouncedReferenceFilter.toLowerCase();
            filtered = filtered.filter((t) =>
                t.reference_number?.toLowerCase().includes(lowerCaseRefFilter)
            );
        }

        // Apply Transaction Type Filter
        if (selectedTypes.length > 0) {
            filtered = filtered.filter((t) =>
                selectedTypes.includes(t.transaction_type)
            );
        }

        // Apply Global Filter (Debounced) - searching notes/reason
        if (debouncedGlobalFilter) {
            const lowerCaseGlobalFilter = debouncedGlobalFilter.toLowerCase();
            filtered = filtered.filter((t) => {
                const reasonMatch = t.reason
                    ?.toLowerCase()
                    .includes(lowerCaseGlobalFilter);
                const notesMatch = t.notes
                    ?.toLowerCase()
                    .includes(lowerCaseGlobalFilter);
                return reasonMatch || notesMatch;
            });
        }

        return filtered;
    }, [
        transactionsWithBalance,
        dateRange,
        debouncedReferenceFilter,
        selectedTypes, // Add selectedTypes dependency
        debouncedGlobalFilter, // Add global filter dependency
    ]);
    // --- Filter state and calculation --- END

    // Column Definitions (Use calculated data)
    const columns: ColumnDef<TransactionWithBalance>[] = useMemo(
        () => [
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
                cell: ({ row }) => (
                    <div className="text-sm whitespace-nowrap">
                        {formatDate(
                            row.getValue("created_at"),
                            DEFAULT_DATETIME_FORMAT
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "transaction_type",
                header: "Type",
                cell: ({ row }) => {
                    const type = row.getValue("transaction_type") as string;
                    const displayName = getTransactionTypeFriendlyName(type);
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
                                "write-off",
                            ].includes(type)
                        )
                            return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";
                        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
                    };
                    return (
                        <Badge
                            variant="outline"
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles(
                                type
                            )}`}
                        >
                            {displayName}
                        </Badge>
                    );
                },
                filterFn: (row, id, value: string[]) =>
                    value.includes(row.getValue(id)),
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
                accessorKey: "reason", // Combine reason and notes
                header: "Reason / Notes",
                cell: ({ row }) => {
                    const reason = row.original.reason;
                    const notes = row.original.notes;
                    const combined = [reason, notes]
                        .filter(Boolean)
                        .join(" | "); // Combine with a separator

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
                accessorKey: "balance",
                header: () => <div className="text-right">Balance</div>,
                cell: ({ row }) => {
                    const balance = row.original.balance;
                    return (
                        <div className="text-right font-medium w-20">
                            {balance} {unit || "units"} {/* Use passed unit */}
                        </div>
                    );
                },
                enableSorting: false, // Usually not sorted
            },
        ],
        [unit]
    );

    // --- START: Handlers & Sidebar State ---
    const handleTypeFilterChange = (
        checked: boolean | string,
        type: string
    ) => {
        setColumnFilters((prevFilters) => {
            const currentTypeFilter = prevFilters.find(
                (f) => f.id === "transaction_type"
            );
            let currentValues = (currentTypeFilter?.value as string[]) ?? [];

            if (checked === true) {
                if (!currentValues.includes(type)) {
                    currentValues = [...currentValues, type];
                }
            } else {
                currentValues = currentValues.filter((v) => v !== type);
            }

            // Remove the old filter if it exists
            const otherFilters = prevFilters.filter(
                (f) => f.id !== "transaction_type"
            );

            // Add the new filter only if there are selected types
            if (currentValues.length > 0) {
                return [
                    ...otherFilters,
                    { id: "transaction_type", value: currentValues },
                ];
            } else {
                return otherFilters; // Return only other filters if no types selected
            }
        });
    };

    const clearSpecificFilters = () => {
        setGlobalFilter("");
        setReferenceFilter("");
        setDateRange(undefined);
        // Clear only the type filter from columnFilters
        setColumnFilters((prev) =>
            prev.filter((f) => f.id !== "transaction_type")
        );
    };

    const sidebarActiveFilterCount = useMemo(() => {
        return (
            (globalFilter ? 1 : 0) +
            (referenceFilter ? 1 : 0) +
            (dateRange ? 1 : 0) +
            (selectedTypes.length > 0 ? 1 : 0)
        );
    }, [globalFilter, referenceFilter, dateRange, selectedTypes]);
    // --- END: Handlers & Sidebar State ---

    const activeFilters = useMemo(() => {
        // This counts ALL active filters including sorting potentially if added
        return sidebarActiveFilterCount > 0; // Simplified based on sidebar filters
    }, [sidebarActiveFilterCount]);

    const table = useReactTable({
        data: filteredTransactions,
        columns,
        state: { sorting, columnFilters, globalFilter: debouncedGlobalFilter },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    const exportToCsv = () => {
        const rows = table.getFilteredRowModel().rows;
        if (!rows.length) {
            toast.warning(
                "Nu exista date de exportat pentru filtrele selectate."
            );
            return;
        }
        const headers = [
            "Data",
            "Tip",
            "Modificare Cantitate",
            "Pret Unitar",
            "Total",
            "Referinta",
            "Motiv/Note",
            "Sold",
        ];
        const dataRows = rows.map((row) => {
            const transaction: TransactionWithBalance = row.original;
            const date = transaction.created_at
                ? format(new Date(transaction.created_at), "dd.MM.yyyy HH:mm", {
                      locale: ro,
                  })
                : "";
            const type = getTransactionTypeFriendlyName(
                transaction.transaction_type || ""
            );
            const quantity = transaction.quantity_change ?? "";
            const unitPriceValue =
                transaction.purchase_price ?? transaction.selling_price;
            const unitPrice = unitPriceValue ?? "";
            const total = transaction.total_price ?? "";
            const reference = transaction.reference_number ?? "";
            const reasonNotes = [transaction.reason, transaction.notes]
                .filter(Boolean)
                .join(" | ");
            const balance = transaction.balance;
            return [
                date,
                type,
                quantity,
                unitPrice,
                total,
                reference,
                reasonNotes,
                balance,
            ]
                .map(escapeCsvValue)
                .join(",");
        });
        const csvContent = [headers.join(","), ...dataRows].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const safeItemName = itemName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const timestamp = new Date().toISOString().split("T")[0];
        link.setAttribute(
            "download",
            `istoric_stoc_${safeItemName}_${timestamp}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Istoricul a fost exportat cu succes.");
    };

    const clearAllFilters = () => {
        setColumnFilters([]);
        setGlobalFilter("");
        setDateRange(undefined);
        setReferenceFilter("");
        const refFilterIndex = columnFilters.findIndex(
            (f) => f.id === "reference_number"
        );
        if (refFilterIndex > -1) {
            const newFilters = [...columnFilters];
            newFilters.splice(refFilterIndex, 1);
            setColumnFilters(newFilters);
        }
    };

    const getDensityPadding = (density: Density): string => {
        switch (density) {
            case "compact":
                return "px-2 py-1 text-xs"; // Adjusted padding
            case "comfortable":
                return "px-4 py-3"; // Adjusted padding
            case "normal":
            default:
                return "px-3 py-2"; // Adjusted padding
        }
    };

    return (
        <Card className="shadow-sm border-border/60">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PackageSearch className="h-5 w-5" />
                        <span>Istoric Tranzacții Stoc</span>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                {/* START: Remove Old Toolbar Content & Add New Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 border-b pb-4">
                    {/* Left Side: Filter Button */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 w-full sm:w-auto relative"
                            >
                                <ListFilter className="mr-2 h-4 w-4" /> Filter
                                {sidebarActiveFilterCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                                    >
                                        {sidebarActiveFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <HistoryFilterSidebar
                            globalFilter={globalFilter}
                            setGlobalFilter={setGlobalFilter}
                            referenceFilter={referenceFilter}
                            setReferenceFilter={setReferenceFilter}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            selectedTypes={selectedTypes}
                            handleTypeFilterChange={handleTypeFilterChange}
                            clearSpecificFilters={clearSpecificFilters}
                            activeFilterCount={sidebarActiveFilterCount}
                        />
                    </Sheet>

                    {/* Right Side: View, Export, Clear All (Optional) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-full sm:w-auto ml-auto"
                                >
                                    <Settings2Icon className="mr-2 h-4 w-4" />
                                    Density
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    Table Density
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                    value={density}
                                    onValueChange={(value) =>
                                        setDensity(value as Density)
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
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-full sm:w-auto"
                                >
                                    <View className="mr-2 h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    Toggle Columns
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        const headerText =
                                            column.columnDef.header &&
                                            typeof column.columnDef.header !==
                                                "string"
                                                ? column.id
                                                : String(
                                                      column.columnDef.header ||
                                                          column.id
                                                  );
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value
                                                    )
                                                }
                                            >
                                                {headerText}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full sm:w-auto"
                            onClick={exportToCsv}
                            disabled={
                                table.getFilteredRowModel().rows.length === 0
                            }
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>

                        {/* Optional: Keep a master clear button? */}
                        {activeFilters && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={clearAllFilters} // Use the original clear all
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            title="Clear all filters"
                                        >
                                            <FilterX className="h-4 w-4" />
                                            <span className="sr-only">
                                                Clear All Filters
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear All Filters</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
                {/* END: Remove Old Toolbar Content & Add New Toolbar */}

                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                getDensityPadding(density),
                                                "h-10"
                                            )}
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
                                        className={cn({
                                            "bg-green-50 dark:bg-green-900/20":
                                                row.original.quantity_change >
                                                0,
                                            "bg-red-50 dark:bg-red-900/20":
                                                row.original.quantity_change <
                                                0,
                                        })}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className={getDensityPadding(
                                                    density
                                                )}
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
                                            <PackageSearch className="h-12 w-12 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                No transactions found
                                            </p>
                                            <p className="text-sm">
                                                Try adjusting filters or the
                                                date range.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between space-x-2 py-4 px-1">
                    <div className="text-sm text-muted-foreground flex-1">
                        Showing{" "}
                        {table.getRowModel().rows.length > 0
                            ? table.getState().pagination.pageIndex *
                                  table.getState().pagination.pageSize +
                              1
                            : 0}
                        -{" "}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) *
                                table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length}{" "}
                        transaction(s)
                        {activeFilters &&
                            ` (filtered from ${transactionsWithBalance.length} total)`}
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
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount() || 1}
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
    );
}
