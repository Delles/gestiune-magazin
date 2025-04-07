import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import {
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
    ALL_TRANSACTION_TYPES,
    getTransactionTypeFriendlyName,
} from "./stock-transaction-history-helpers"; // Assume helpers extracted

interface HistoryFilterSidebarProps {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    referenceFilter: string;
    setReferenceFilter: (value: string) => void;
    dateRange: DateRange | undefined;
    setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
    selectedTypes: string[];
    handleTypeFilterChange: (checked: boolean | string, type: string) => void;
    clearSpecificFilters: () => void;
    activeFilterCount: number;
}

export function HistoryFilterSidebar({
    globalFilter,
    setGlobalFilter,
    referenceFilter,
    setReferenceFilter,
    dateRange,
    setDateRange,
    selectedTypes,
    handleTypeFilterChange,
    clearSpecificFilters,
    activeFilterCount,
}: HistoryFilterSidebarProps) {
    return (
        <SheetContent side="left" className="flex flex-col w-full sm:max-w-md">
            <SheetHeader className="px-6 pt-6">
                <SheetTitle className="text-lg font-semibold">
                    Filter History
                </SheetTitle>
                <SheetDescription>
                    Refine the transaction list based on selected criteria.
                </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />

            <ScrollArea className="flex-grow px-6">
                <div className="space-y-6 pb-6">
                    {/* Global Search */}
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Search Notes/Reason
                        </Label>
                        <div className="relative pl-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search content..."
                                value={globalFilter ?? ""}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 pl-9 w-full"
                            />
                            {globalFilter && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => setGlobalFilter("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Reference Filter */}
                    <Separator />
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Reference Number
                        </Label>
                        <div className="relative pl-1">
                            <Input
                                placeholder="Filter by Ref#..."
                                value={referenceFilter}
                                onChange={(e) =>
                                    setReferenceFilter(e.target.value)
                                }
                                className="h-9 w-full"
                            />
                            {referenceFilter && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => setReferenceFilter("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <Separator />
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Date Range
                        </Label>
                        <p className="text-xs text-muted-foreground pl-1">
                            Select a single day or a date range.
                        </p>
                        <div className="pl-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-9",
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
                                    align="start"
                                >
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="p-2 border-r flex flex-col gap-1 min-w-[120px]">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-7 px-2"
                                                onClick={() =>
                                                    setDateRange({
                                                        from: new Date(),
                                                        to: new Date(),
                                                    })
                                                }
                                            >
                                                Today
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-7 px-2"
                                                onClick={() =>
                                                    setDateRange({
                                                        from: addDays(
                                                            new Date(),
                                                            -6
                                                        ),
                                                        to: new Date(),
                                                    })
                                                }
                                            >
                                                Last 7 Days
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-7 px-2"
                                                onClick={() =>
                                                    setDateRange({
                                                        from: startOfWeek(
                                                            new Date()
                                                        ),
                                                        to: endOfWeek(
                                                            new Date()
                                                        ),
                                                    })
                                                }
                                            >
                                                This Week
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-7 px-2"
                                                onClick={() =>
                                                    setDateRange({
                                                        from: startOfMonth(
                                                            new Date()
                                                        ),
                                                        to: endOfMonth(
                                                            new Date()
                                                        ),
                                                    })
                                                }
                                            >
                                                This Month
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start h-7 px-2"
                                                onClick={() => {
                                                    const start = startOfMonth(
                                                        subMonths(new Date(), 1)
                                                    );
                                                    const end = endOfMonth(
                                                        subMonths(new Date(), 1)
                                                    );
                                                    setDateRange({
                                                        from: start,
                                                        to: end,
                                                    });
                                                }}
                                            >
                                                Last Month
                                            </Button>
                                        </div>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={1} // Single month for sidebar popover
                                        />
                                    </div>
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
                    </div>

                    {/* Transaction Type Filter */}
                    <Separator />
                    <div className="space-y-3">
                        <Label className="font-medium text-base">
                            Transaction Types
                        </Label>
                        <div className="space-y-2 pl-1 max-h-60 overflow-y-auto pr-2">
                            {ALL_TRANSACTION_TYPES.map((type: string) => (
                                <Label
                                    key={type}
                                    className="flex items-center gap-2 font-normal cursor-pointer"
                                >
                                    <Checkbox
                                        id={`hist-type-${type}`}
                                        checked={selectedTypes.includes(type)}
                                        onCheckedChange={(checked) =>
                                            handleTypeFilterChange(
                                                checked,
                                                type
                                            )
                                        }
                                    />
                                    {getTransactionTypeFriendlyName(type)}
                                </Label>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <Separator className="mt-auto" />
            <SheetFooter className="flex-col sm:flex-row sm:justify-between gap-2 px-6 py-4 border-t">
                <Button
                    variant="ghost"
                    onClick={clearSpecificFilters}
                    className={cn({
                        "relative pr-6": activeFilterCount > 0,
                    })}
                    disabled={activeFilterCount === 0}
                >
                    Clear Filters
                    {activeFilterCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-xs"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
                <SheetClose asChild>
                    <Button>Done</Button>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    );
}
