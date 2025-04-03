"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";

interface AdjustReorderPointPopoverProps {
    itemId: string;
    currentItemName: string;
    currentReorderPoint: number | null;
    unit: string;
    onSave: (newPoint: number | null) => void;
    onCancel: () => void;
    isSaving?: boolean;
    // Popover trigger will be handled externally
}

export const AdjustReorderPointPopoverContent: React.FC<
    AdjustReorderPointPopoverProps
> = ({
    itemId,
    currentItemName,
    currentReorderPoint,
    unit,
    onSave,
    onCancel,
    isSaving,
}) => {
    const [newPoint, setNewPoint] = useState<string>(
        currentReorderPoint === null ? "" : String(currentReorderPoint)
    );
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPoint(value);
        // Basic validation on change
        if (value !== "" && (!/^[0-9]*$/.test(value) || Number(value) < 0)) {
            setError("Must be a non-negative whole number.");
        } else {
            setError(null);
        }
    };

    const handleSaveClick = () => {
        if (error) return; // Don't save if there's a validation error

        const finalValue = newPoint === "" ? null : Number(newPoint);
        onSave(finalValue);
    };

    return (
        <div className="p-4 space-y-4 w-64">
            <h4 className="font-medium leading-none truncate">
                Reorder Point: {currentItemName}
            </h4>
            <div className="space-y-1">
                <Label htmlFor={`current-reorder-${itemId}`}>Current</Label>
                <Input
                    id={`current-reorder-${itemId}`}
                    readOnly
                    value={`${currentReorderPoint ?? "Not set"} ${unit}`}
                    className="h-8 text-muted-foreground bg-muted/50 text-xs"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor={`new-reorder-${itemId}`}>New Point</Label>
                <Input
                    id={`new-reorder-${itemId}`}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter new point..."
                    value={newPoint}
                    onChange={handleInputChange}
                    className={cn("h-8", error && "border-destructive")}
                />
                {error && (
                    <p className="text-xs text-destructive mt-1">{error}</p>
                )}
            </div>
            <div className="flex justify-end items-center gap-2 pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="transition-colors duration-150"
                >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={
                        isSaving ||
                        !!error ||
                        newPoint === String(currentReorderPoint ?? "")
                    }
                    className="transition-colors duration-150"
                >
                    {isSaving ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="mr-1 h-4 w-4" />
                    )}
                    Save
                </Button>
            </div>
        </div>
    );
};
