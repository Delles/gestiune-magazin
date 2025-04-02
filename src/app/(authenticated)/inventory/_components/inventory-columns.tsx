import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { InventoryItem } from "../types/types";

// --- Helper Components ---
export const SortableHeader = ({
    column,
    children,
    align = "left",
}: {
    column: import("@tanstack/react-table").Column<InventoryItem, unknown>; // Use unknown for value type
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

// --- Column Definitions ---
export const columns: ColumnDef<InventoryItem>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
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
                (row.getValue("category_name") as string) || "Uncategorized";
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
        // enableColumnFilter: true, // Can be enabled later if needed directly on column
    },
    {
        accessorKey: "stock_quantity",
        header: ({ column }) => (
            <SortableHeader column={column} align="left">
                Stock
            </SortableHeader>
        ),
        cell: ({ row }) => {
            const item = row.original;
            const quantity = item.stock_quantity;
            const reorderPoint = item.reorder_point ?? 0; // Default reorder point to 0 if null
            const unit = item.unit;

            let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
            let percentage = 100; // Default to full if no reorder point or well above
            let progressBarColor = "bg-emerald-500"; // Green

            if (quantity <= 0) {
                status = "out_of_stock";
                percentage = 0;
                progressBarColor = "bg-destructive"; // Red
            } else if (reorderPoint > 0) {
                // Calculate percentage relative to reorder point, capped at 100%
                percentage = Math.min(
                    100,
                    Math.max(0, (quantity / reorderPoint) * 50 + 50)
                ); // Scaled: 0 stock = 0%, reorder point = 50%, 2x reorder point = 100%

                if (quantity <= reorderPoint) {
                    status = "low_stock";
                    progressBarColor = "bg-yellow-500"; // Yellow
                }
            }

            return (
                <div className="flex flex-col items-start w-32">
                    <div className="flex items-baseline gap-1 w-full">
                        <span className="font-semibold text-base">
                            {quantity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {unit}
                        </span>
                    </div>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1 cursor-default">
                                    <div
                                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {status === "low_stock" &&
                                    `Low Stock (Reorder: ${reorderPoint} ${unit})`}
                                {status === "out_of_stock" && "Out of Stock"}
                                {status === "in_stock" &&
                                    (reorderPoint > 0
                                        ? `In Stock (Reorder: ${reorderPoint} ${unit})`
                                        : "In Stock")}
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
            const filterReorderPoint = item.reorder_point;
            let currentStatus: string = "in_stock";
            if (quantity <= 0) {
                currentStatus = "out_of_stock";
            } else if (
                filterReorderPoint !== null &&
                quantity <= filterReorderPoint
            ) {
                currentStatus = "low_stock";
            }
            return value.includes(currentStatus);
        },
        // enableColumnFilter: true, // Can be enabled later if needed directly on column
    },
    {
        accessorKey: "initial_purchase_price",
        header: ({ column }) => (
            <SortableHeader column={column} align="right">
                Purchase Price
            </SortableHeader>
        ),
        cell: ({ row }) => (
            <div className="text-right font-mono text-sm">
                {formatCurrency(row.getValue("initial_purchase_price"))}
            </div>
        ),
    },
    {
        accessorKey: "last_purchase_price",
        header: ({ column }) => (
            <SortableHeader column={column} align="right">
                Last Purchase
            </SortableHeader>
        ),
        cell: ({ row }) => (
            <div className="text-right font-mono text-sm">
                {formatCurrency(row.getValue("last_purchase_price"))}
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
        cell: () => {
            // Cell content is handled by DisplayRow/InlineEditFormRow in the main component
            return null;
        },
        header: () => <div className="text-right pr-2">Actions</div>,
        enableHiding: false,
    },
];
