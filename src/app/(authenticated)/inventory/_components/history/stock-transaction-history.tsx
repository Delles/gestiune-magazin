// src/app/(authenticated)/inventory/_components/history/stock-transaction-history.tsx
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
import {
    formatDate,
    formatCurrency,
    DEFAULT_DATETIME_FORMAT,
} from "@/lib/utils";
import {
    ArrowUpDown,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    PackageSearch, // Icon for empty state
    X,
    AlertCircle, // Icon for clearing filters
    ListFilter, // For Type Filter Button
    CalendarIcon, // For Date Range Placeholder
    FileDown, // For Export
    View, // For Columns
    FilterX, // For Clear Filters
    Settings2Icon, // For Density Toggle
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
import { StockTransaction } from "../../types/types"; // Import type
import { getStockTransactions } from "../../_data/api"; // Import API function
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
import { Calendar } from "@/components/ui/calendar"; // Added
import { format, isWithinInterval } from "date-fns"; // Added date-fns functions
import { cn } from "@/lib/utils";
import { ro } from "date-fns/locale"; // Import Romanian locale for date formatting
import { toast } from "sonner"; // Correct toast import

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
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined
    );
    const [referenceFilter, setReferenceFilter] = useState("");
    const debouncedReferenceFilter = useDebounce(referenceFilter, 300);

    // --- Add Density State ---
    const [density, setDensity] = useState<Density>("normal");

    const {
        data: transactions = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<StockTransaction[], unknown>({
        // Keep error as unknown
        queryKey: ["stockTransactions", itemId],
        queryFn: () => getStockTransactions(itemId),
        // Consider adding placeholderData or staleTime if needed
    });

    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];
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
        if (debouncedReferenceFilter) {
            const lowerCaseFilter = debouncedReferenceFilter.toLowerCase();
            filtered = filtered.filter((t) =>
                t.reference_number?.toLowerCase().includes(lowerCaseFilter)
            );
        }
        return filtered;
    }, [transactions, dateRange, debouncedReferenceFilter]);

    const columns: ColumnDef<StockTransaction>[] = useMemo(
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
    );

    const activeFilters = useMemo(() => {
        const typeFilter = columnFilters.find(
            (f) => f.id === "transaction_type"
        );
        return (
            globalFilter.length > 0 ||
            (typeFilter && (typeFilter.value as string[]).length > 0) ||
            referenceFilter.length > 0 ||
            dateRange !== undefined
        );
    }, [globalFilter, columnFilters, dateRange, referenceFilter]);

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
            "Utilizator",
        ];
        const dataRows = rows.map((row) => {
            const transaction: StockTransaction = row.original;
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
            const user = transaction.user_name || "System";
            return [
                date,
                type,
                quantity,
                unitPrice,
                total,
                reference,
                reasonNotes,
                user,
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

    const handleTypeFilterChange = (
        checked: boolean | string,
        type: string
    ) => {
        const currentFilter = columnFilters.find(
            (f) => f.id === "transaction_type"
        )?.value as string[] | undefined;
        let newFilterValues = currentFilter ? [...currentFilter] : [];
        if (checked === true) {
            if (!newFilterValues.includes(type)) {
                newFilterValues.push(type);
            }
        } else {
            newFilterValues = newFilterValues.filter((v) => v !== type);
        }
        const otherFilters = columnFilters.filter(
            (f) => f.id !== "transaction_type"
        );
        if (newFilterValues.length > 0) {
            setColumnFilters([
                ...otherFilters,
                { id: "transaction_type", value: newFilterValues },
            ]);
        } else {
            setColumnFilters(otherFilters);
        }
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

    if (isLoading) {
        return (
            <Card className="shadow-sm border-border/60">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
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
        // More defensive error message extraction
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        }

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
                        Failed to load transaction history. {errorMessage}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Try again
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                                    onClick={() => refetch()}
                                    title="Refresh data"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${
                                            isLoading ? "animate-spin" : ""
                                        }`}
                                    />
                                    <span className="sr-only">
                                        Refresh data
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh Data</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-col gap-4 mb-4 border-b pb-4">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative flex-1 w-full sm:max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notes, reasons..."
                                    value={globalFilter ?? ""}
                                    onChange={(event) =>
                                        setGlobalFilter(event.target.value)
                                    }
                                    className="pl-8 w-full h-9"
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
                            <div className="relative flex-1 w-full sm:max-w-xs">
                                <Input
                                    placeholder="Filter by Ref#..."
                                    value={referenceFilter}
                                    onChange={(e) =>
                                        setReferenceFilter(e.target.value)
                                    }
                                    className="w-full h-9"
                                />
                                {referenceFilter && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={() => setReferenceFilter("")}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full sm:w-[260px] justify-start text-left font-normal h-9",
                                            !dateRange &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(
                                                        dateRange.from,
                                                        "LLL dd, y"
                                                    )}{" "}
                                                    -{" "}
                                                    {format(
                                                        dateRange.to,
                                                        "LLL dd, y"
                                                    )}
                                                </>
                                            ) : (
                                                format(
                                                    dateRange.from,
                                                    "LLL dd, y"
                                                )
                                            )
                                        ) : (
                                            <span>Select Date Range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="end"
                                >
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                    {dateRange && (
                                        <div className="p-2 border-t flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setDateRange(undefined)
                                                }
                                            >
                                                Clear Dates
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-full sm:w-auto"
                                    >
                                        <ListFilter className="mr-2 h-4 w-4" />{" "}
                                        Filter Types
                                        {((
                                            columnFilters.find(
                                                (f) =>
                                                    f.id === "transaction_type"
                                            )?.value as string[] | undefined
                                        )?.length ?? 0) > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="rounded-sm px-1 font-normal ml-2"
                                            >
                                                {(
                                                    columnFilters.find(
                                                        (f) =>
                                                            f.id ===
                                                            "transaction_type"
                                                    )?.value as string[]
                                                )?.length ?? 0}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-64 p-0"
                                    align="start"
                                >
                                    <div className="p-4">
                                        <h4 className="font-medium leading-none mb-2">
                                            Filter by Type
                                        </h4>
                                        <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                                            {ALL_TRANSACTION_TYPES.map(
                                                (type) => (
                                                    <Label
                                                        key={type}
                                                        className="flex items-center gap-2 font-normal cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                (
                                                                    columnFilters.find(
                                                                        (f) =>
                                                                            f.id ===
                                                                            "transaction_type"
                                                                    )?.value as
                                                                        | string[]
                                                                        | undefined
                                                                )?.includes(
                                                                    type
                                                                ) ?? false
                                                            }
                                                            onCheckedChange={(
                                                                checked
                                                            ) =>
                                                                handleTypeFilterChange(
                                                                    checked,
                                                                    type
                                                                )
                                                            }
                                                        />{" "}
                                                        {getTransactionTypeFriendlyName(
                                                            type
                                                        )}
                                                    </Label>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {((
                                        columnFilters.find(
                                            (f) => f.id === "transaction_type"
                                        )?.value as string[] | undefined
                                    )?.length ?? 0) > 0 && (
                                        <>
                                            <Separator />
                                            <div className="p-2 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleTypeFilterChange(
                                                            false,
                                                            ""
                                                        )
                                                    }
                                                >
                                                    Clear Type Filter
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </PopoverContent>
                            </Popover>

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
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
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
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                >
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
                                                typeof column.columnDef
                                                    .header !== "string"
                                                    ? column.id
                                                    : String(
                                                          column.columnDef
                                                              .header ||
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
                                    table.getFilteredRowModel().rows.length ===
                                    0
                                }
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                            </Button>

                            {activeFilters && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={clearAllFilters}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                            title="Clear all filters"
                                        >
                                            <FilterX className="h-4 w-4" />
                                            <span className="sr-only">
                                                Clear Filters
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear All Filters</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
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
                                                className={cn(
                                                    "px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider", // Base classes
                                                    {
                                                        "py-1 h-9":
                                                            density ===
                                                            "compact",
                                                        "py-2 h-auto":
                                                            density ===
                                                            "normal",
                                                        "py-3 h-11":
                                                            density ===
                                                            "comfortable",
                                                    }
                                                )}
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
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={`skeleton-${i}`}>
                                            {columns.map((column) => (
                                                <TableCell key={column.id || i}>
                                                    <Skeleton className="h-5 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-48 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center text-destructive space-y-3">
                                                <AlertCircle className="h-12 w-12 text-destructive/50" />
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        Error Loading History
                                                    </p>
                                                    <p className="text-sm">
                                                        {errorMessage}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => refetch()}
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Try again
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                            className={cn(
                                                "hover:bg-muted/30", // Existing hover
                                                // Highlight initial stock rows
                                                row.original
                                                    .transaction_type ===
                                                    "initial-stock" &&
                                                    "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100/80 dark:hover:bg-blue-950/50"
                                            )}
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            "px-3 align-top", // Base classes
                                                            {
                                                                "py-1.5 text-xs":
                                                                    density ===
                                                                    "compact",
                                                                "py-2.5 text-sm":
                                                                    density ===
                                                                    "normal",
                                                                "py-3.5 text-sm":
                                                                    density ===
                                                                    "comfortable",
                                                            }
                                                        )}
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
                                                        {activeFilters
                                                            ? "Try adjusting your filters."
                                                            : "There are no stock changes recorded yet."}
                                                    </p>
                                                </div>
                                                {activeFilters && (
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
