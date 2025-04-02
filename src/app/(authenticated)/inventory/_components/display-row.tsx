// src/app/(authenticated)/inventory/_components/display-row.tsx
"use client"; // Add use client directive

import * as React from "react";
import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@/components/ui/table";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Pencil, BarChart4, Eye } from "lucide-react"; // Necessary icons
import { cn } from "@/lib/utils";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// --- Type Definition (Import or define consistently) ---
// Assuming InventoryItem is defined elsewhere and imported or defined here
// Consider moving this to a shared types file (e.g., src/types/inventory.ts)
type InventoryItem = {
    id: string;
    item_name: string;
    category_id: string | null;
    category_name?: string;
    unit: string;
    initial_purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_point: number | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    last_purchase_price: number | null;
    average_purchase_price: number | null;
};

// --- Helper Component (ActionTooltipButton - Copied here or import from shared) ---
// Consider moving this to a shared components utility file
const ActionTooltipButton = ({
    tooltip,
    icon: Icon,
    onClick,
    disabled,
}: {
    tooltip: string;
    icon: React.ElementType;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClick}
                disabled={disabled}
            >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{tooltip}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
);

// --- Props Interface ---
interface DisplayRowProps {
    row: Row<InventoryItem>;
    density: "compact" | "normal" | "comfortable";
    router: AppRouterInstance;
    setAdjustingStockItem: (item: InventoryItem | null) => void;
    handleEditClick: (itemId: string) => void;
}

// --- Main Component ---
const DisplayRow = React.memo(
    ({
        row,
        density,
        router,
        setAdjustingStockItem,
        handleEditClick,
    }: DisplayRowProps) => {
        const item = row.original;

        return (
            <TableRow
                key={row.id} // Key is technically handled by parent, but good practice
                data-state={row.getIsSelected() && "selected"}
                onClick={() => router.push(`/inventory/${item.id}`)}
                className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/10 group",
                    {
                        "text-xs": density === "compact",
                        "text-sm": density === "normal",
                        "text-base": density === "comfortable",
                    }
                )}
            >
                {row.getVisibleCells().map((cell) => {
                    const isInteractiveColumn =
                        cell.column.id === "select" ||
                        cell.column.id === "actions";

                    return (
                        <TableCell
                            key={cell.id}
                            className={cn("align-top", {
                                "px-2 py-1": density === "compact",
                                "px-3 py-3": density === "normal",
                                "px-4 py-4": density === "comfortable",
                            })}
                            onClick={
                                isInteractiveColumn
                                    ? (e) => e.stopPropagation()
                                    : undefined
                            }
                        >
                            {cell.column.id === "actions" ? (
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(
                                                            item.id
                                                        );
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Edit Item
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p>Edit Item</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <ActionTooltipButton
                                            tooltip="Adjust Stock"
                                            icon={BarChart4}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAdjustingStockItem(item);
                                            }}
                                        />
                                        <ActionTooltipButton
                                            tooltip="View Details"
                                            icon={Eye}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(
                                                    `/inventory/${item.id}`
                                                );
                                            }}
                                        />
                                    </TooltipProvider>
                                </div>
                            ) : (
                                flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )
                            )}
                        </TableCell>
                    );
                })}
            </TableRow>
        );
    }
);
DisplayRow.displayName = "DisplayRow";

export default DisplayRow;
