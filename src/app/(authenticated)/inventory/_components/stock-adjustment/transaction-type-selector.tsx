"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type TransactionType } from "@/lib/validation/inventory-schemas";
import { INCREASE_TYPES, DECREASE_TYPES } from "./utils";
import { TRANSACTION_TYPES } from "./transaction-types";

interface TransactionTypeSelectorProps {
    value: TransactionType;
    onChange: (value: TransactionType) => void;
    stockActionType: "increase" | "decrease";
}

export function TransactionTypeSelector({
    value,
    onChange,
    stockActionType,
}: TransactionTypeSelectorProps) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-medium">Transaction Type</Label>
            <Select
                value={value}
                onValueChange={(value) => onChange(value as TransactionType)}
            >
                <SelectTrigger className="h-8 text-sm bg-background">
                    <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                    {stockActionType === "increase" ? (
                        <div className="space-y-0.5 p-1">
                            {INCREASE_TYPES.map((type) => (
                                <SelectItem
                                    key={type}
                                    value={type}
                                    className="text-sm rounded-md"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-primary/10 p-1 rounded-md">
                                            {TRANSACTION_TYPES[type].icon}
                                        </div>
                                        <span>
                                            {TRANSACTION_TYPES[type].label}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-0.5 p-1">
                            {DECREASE_TYPES.map((type) => (
                                <SelectItem
                                    key={type}
                                    value={type}
                                    className="text-sm rounded-md"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-primary/10 p-1 rounded-md">
                                            {TRANSACTION_TYPES[type].icon}
                                        </div>
                                        <span>
                                            {TRANSACTION_TYPES[type].label}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </div>
                    )}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                {value && TRANSACTION_TYPES[value].description}
            </p>
        </div>
    );
}
