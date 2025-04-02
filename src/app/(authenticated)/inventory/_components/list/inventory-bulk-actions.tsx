"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface InventoryBulkActionsProps {
    selectedRowCount: number;
    onDelete: () => void;
    isDeleting: boolean;
}

export function InventoryBulkActions({
    selectedRowCount,
    onDelete,
    isDeleting,
}: InventoryBulkActionsProps) {
    if (selectedRowCount === 0) {
        return null; // Don't render anything if no rows are selected
    }

    return (
        <div className="flex items-center gap-3 px-3 py-2 border rounded-md bg-muted mb-4 justify-between animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <span className="text-sm font-medium text-muted-foreground">
                {selectedRowCount} item(s) selected
            </span>
            <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                    </>
                ) : (
                    <>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected (
                        {selectedRowCount})
                    </>
                )}
            </Button>
        </div>
    );
}
