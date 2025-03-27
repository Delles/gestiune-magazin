"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";
import { type TransactionType } from "@/lib/validation/inventory-schemas";

interface PriceFieldsProps {
    transactionType: TransactionType;
    purchasePrice: number | null;
    sellingPrice: number | null;
    totalPrice: number | null;
    onPurchasePriceChange: (value: number) => void;
    onSellingPriceChange: (value: number) => void;
    onTotalPriceChange: (value: number) => void;
}

export function PriceFields({
    transactionType,
    purchasePrice,
    sellingPrice,
    totalPrice,
    onPurchasePriceChange,
    onSellingPriceChange,
    onTotalPriceChange,
}: PriceFieldsProps) {
    const isPurchaseOrReturn =
        transactionType === "purchase" || transactionType === "return";
    const isSaleOrLossType =
        transactionType === "sale" ||
        transactionType === "damaged" ||
        transactionType === "expired" ||
        transactionType === "loss";

    return (
        <Card className="border-none shadow-sm bg-muted/40 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300/30 to-amber-500/30 h-1"></div>
            <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                    <div className="bg-amber-100 text-amber-700 p-1 rounded-md">
                        <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-medium">Price Information</h3>
                </div>
                <Separator className="my-1.5" />

                {isPurchaseOrReturn && (
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                {transactionType === "purchase"
                                    ? "Purchase Price (per unit)"
                                    : "Return Value (per unit)"}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1.5 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    className="pl-6 h-8 text-sm bg-background"
                                    value={
                                        purchasePrice === null
                                            ? ""
                                            : purchasePrice
                                    }
                                    onChange={(e) =>
                                        onPurchasePriceChange(
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    min={0}
                                    step={0.01}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                                {transactionType === "purchase"
                                    ? "Per unit paid to supplier"
                                    : "Per unit value of returned items"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                Total Price
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1.5 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    className="pl-6 h-8 text-sm bg-background"
                                    value={
                                        totalPrice === null ? "" : totalPrice
                                    }
                                    onChange={(e) =>
                                        onTotalPriceChange(
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    min={0}
                                    step={0.01}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                                Total amount for this transaction
                            </p>
                        </div>
                    </div>
                )}

                {isSaleOrLossType && (
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                {transactionType === "sale"
                                    ? "Selling Price (per unit)"
                                    : "Item Value (per unit)"}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1.5 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    className="pl-6 h-8 text-sm bg-background"
                                    value={
                                        sellingPrice === null
                                            ? ""
                                            : sellingPrice
                                    }
                                    onChange={(e) =>
                                        onSellingPriceChange(
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    min={0}
                                    step={0.01}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                                {transactionType === "sale"
                                    ? "Per unit sold to customer"
                                    : "Per unit value of affected items"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">
                                Total Price
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1.5 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    className="pl-6 h-8 text-sm bg-background"
                                    value={
                                        totalPrice === null ? "" : totalPrice
                                    }
                                    onChange={(e) =>
                                        onTotalPriceChange(
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    min={0}
                                    step={0.01}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                                Total amount for this transaction
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
