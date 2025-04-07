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
import { Pencil, SlidersHorizontal, Target, Trash2 } from "lucide-react"; // Updated icons
import { cn } from "@/lib/utils";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { InventoryItem } from "../../types/types"; // Import type
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // Import Popover
import { AdjustReorderPointPopoverContent } from "./AdjustReorderPointPopover"; // Import Popover Content

// --- Helper Component (ActionTooltipButton - Modified to allow 'asChild') ---
const ActionTooltipButton = React.forwardRef<
    HTMLButtonElement,
    {
        tooltip: string;
        icon: React.ElementType;
        onClick?: (e: React.MouseEvent) => void; // Make onClick optional if used as PopoverTrigger
        disabled?: boolean;
        asChild?: boolean; // Add asChild prop
        children?: React.ReactNode;
    }
>(({ tooltip, icon: Icon, onClick, disabled, asChild, children }, ref) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                ref={ref} // Forward ref
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClick}
                disabled={disabled}
                asChild={asChild} // Pass asChild to Button
            >
                {/* Render children if asChild is true, otherwise render Icon */}
                {asChild ? (
                    children
                ) : (
                    <>
                        <Icon className="h-4 w-4" />
                        <span className="sr-only">{tooltip}</span>
                    </>
                )}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
));
ActionTooltipButton.displayName = "ActionTooltipButton";

// --- Props Interface ---
interface DisplayRowProps {
    row: Row<InventoryItem>;
    density: "compact" | "normal" | "comfortable";
    router: AppRouterInstance;
    setAdjustingStockItem: (item: InventoryItem | null) => void;
    handleEditClick: (itemId: string) => void;
    // Update props for Popover handling
    reorderPointItemId: string | null;
    setReorderPointItemId: (id: string | null) => void;
    handleSaveReorderPoint: (newPoint: number | null) => void;
    isSavingReorderPoint: boolean;
    handleDeleteItemClick: (item: InventoryItem) => void;
}

// --- Main Component ---
const DisplayRow = React.memo(
    ({
        row,
        density,
        router,
        setAdjustingStockItem,
        handleEditClick,
        // Destructure new props
        reorderPointItemId,
        setReorderPointItemId,
        handleSaveReorderPoint,
        isSavingReorderPoint,
        handleDeleteItemClick,
    }: DisplayRowProps) => {
        const item = row.original;
        const isPopoverOpen = reorderPointItemId === item.id;

        const handleOpenChange = (open: boolean) => {
            setReorderPointItemId(open ? item.id : null);
        };

        const handleCancel = () => {
            setReorderPointItemId(null);
        };

        // START: Determine stock status for highlighting
        const isLowStock =
            item.reorder_point !== null &&
            item.stock_quantity <= item.reorder_point &&
            item.stock_quantity > 0;
        const isOutOfStock = item.stock_quantity <= 0;
        // END: Determine stock status

        return (
            <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => router.push(`/inventory/${item.id}`)}
                className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/10 group",
                    {
                        "text-xs": density === "compact",
                        "text-sm": density === "normal",
                        "text-base": density === "comfortable",
                    },
                    // START: Apply conditional background classes
                    isOutOfStock &&
                        "bg-destructive/5 hover:bg-destructive/10 data-[state=selected]:bg-destructive/15", // Subtle red
                    isLowStock &&
                        "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 data-[state=selected]:bg-yellow-950/50" // Subtle yellow
                    // END: Apply conditional background classes
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
                                "px-2 py-1.5": density === "compact",
                                "px-3 py-3": density === "normal",
                                "px-4 py-4": density === "comfortable",
                                "pr-3": cell.column.id === "actions",
                            })}
                            onClick={
                                isInteractiveColumn
                                    ? (e) => e.stopPropagation()
                                    : undefined
                            }
                        >
                            {cell.column.id === "actions" ? (
                                <div className="flex justify-end gap-1 items-center transition-opacity duration-200">
                                    <TooltipProvider delayDuration={100}>
                                        {/* Edit Button */}
                                        <ActionTooltipButton
                                            tooltip="Edit Item"
                                            icon={Pencil}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(item.id);
                                            }}
                                        />
                                        {/* Adjust Stock Button */}
                                        <ActionTooltipButton
                                            tooltip="Adjust Stock"
                                            icon={SlidersHorizontal}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAdjustingStockItem(item);
                                            }}
                                        />
                                        {/* Adjust Reorder Point Popover & Trigger */}
                                        <Popover
                                            open={isPopoverOpen}
                                            onOpenChange={handleOpenChange}
                                        >
                                            <PopoverTrigger asChild>
                                                {/* Use forwardRef version of ActionTooltipButton */}
                                                <ActionTooltipButton
                                                    tooltip="Adjust Reorder Point"
                                                    icon={Target}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    } // Prevent row click, open handled by Popover
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="p-0 w-auto"
                                                side="bottom"
                                                align="end"
                                            >
                                                {/* Render content only when open to fetch correct item data potentially */}
                                                {isPopoverOpen && (
                                                    <AdjustReorderPointPopoverContent
                                                        itemId={item.id}
                                                        currentItemName={
                                                            item.item_name
                                                        }
                                                        currentReorderPoint={
                                                            item.reorder_point
                                                        }
                                                        unit={item.unit}
                                                        onSave={
                                                            handleSaveReorderPoint
                                                        }
                                                        onCancel={handleCancel} // Use local cancel
                                                        isSaving={
                                                            isSavingReorderPoint
                                                        }
                                                    />
                                                )}
                                            </PopoverContent>
                                        </Popover>

                                        {/* Delete Button */}
                                        <ActionTooltipButton
                                            tooltip="Delete Item"
                                            icon={Trash2}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteItemClick(item);
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
