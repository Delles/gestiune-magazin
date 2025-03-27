"use client";

import React from "react";
import {
    ShoppingCart,
    PackageCheck,
    Plus,
    ArrowUp,
    Store,
    PackageX,
    AlertTriangle,
    Minus,
    ArrowDown,
} from "lucide-react";
import { type TransactionType } from "@/lib/validation/inventory-schemas";

// List of transaction types with labels and icons for UI
export const TRANSACTION_TYPES: Record<
    TransactionType,
    { label: string; icon: React.ReactNode; description: string }
> = {
    // Increase types
    purchase: {
        label: "Purchase",
        icon: <ShoppingCart className="h-4 w-4" />,
        description: "Receive new stock from supplier",
    },
    return: {
        label: "Customer Return",
        icon: <PackageCheck className="h-4 w-4" />,
        description: "Stock returned by customers",
    },
    "inventory-correction-add": {
        label: "Inventory Correction (Add)",
        icon: <Plus className="h-4 w-4" />,
        description: "Correct inventory count (add stock)",
    },
    "other-addition": {
        label: "Other Addition",
        icon: <ArrowUp className="h-4 w-4" />,
        description: "Other stock increase reasons",
    },

    // Decrease types
    sale: {
        label: "Manual Sale",
        icon: <Store className="h-4 w-4" />,
        description: "Record a manual sale",
    },
    damaged: {
        label: "Damaged Goods",
        icon: <PackageX className="h-4 w-4" />,
        description: "Stock damaged and no longer usable",
    },
    loss: {
        label: "Loss",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Stock lost or stolen",
    },
    expired: {
        label: "Expired",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Stock expired and no longer usable",
    },
    "inventory-correction-remove": {
        label: "Inventory Correction (Remove)",
        icon: <Minus className="h-4 w-4" />,
        description: "Correct inventory count (remove stock)",
    },
    "other-removal": {
        label: "Other Removal",
        icon: <ArrowDown className="h-4 w-4" />,
        description: "Other stock decrease reasons",
    },
};
