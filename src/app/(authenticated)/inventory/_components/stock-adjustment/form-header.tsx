"use client";

import React from "react";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { History, BarChart3 } from "lucide-react";

interface FormHeaderProps {
    itemName: string;
    currentStock: number;
    unit: string;
}

// Recent transactions (dummy data) - could be passed as props in a real implementation
const recentTransactions = [
    {
        date: "Today, 2:30 PM",
        type: "purchase",
        quantity: 15,
        user: "John Doe",
    },
    {
        date: "Yesterday, 10:15 AM",
        type: "sale",
        quantity: 5,
        user: "Jane Smith",
    },
    {
        date: "Mar 25, 2023",
        type: "damaged",
        quantity: 2,
        user: "Mike Johnson",
    },
];

export function FormHeader({ itemName, currentStock, unit }: FormHeaderProps) {
    return (
        <DialogHeader className="pb-0 space-y-1">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold tracking-tight">
                    Adjust Stock for {itemName}
                </DialogTitle>
                <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <History className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <div className="w-64 p-1">
                                    <h3 className="font-medium mb-2">
                                        Recent Transactions
                                    </h3>
                                    <div className="space-y-1.5">
                                        {recentTransactions.map(
                                            (transaction, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`p-1 rounded-full ${
                                                                transaction.type ===
                                                                "purchase"
                                                                    ? "bg-green-100"
                                                                    : transaction.type ===
                                                                      "sale"
                                                                    ? "bg-blue-100"
                                                                    : "bg-amber-100"
                                                            }`}
                                                        >
                                                            {transaction.type ===
                                                            "purchase" ? (
                                                                <div className="h-3 w-3">
                                                                    +
                                                                </div>
                                                            ) : transaction.type ===
                                                              "sale" ? (
                                                                <div className="h-3 w-3">
                                                                    -
                                                                </div>
                                                            ) : (
                                                                <div className="h-3 w-3">
                                                                    !
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span>
                                                            {transaction.type ===
                                                            "purchase"
                                                                ? "Added"
                                                                : transaction.type ===
                                                                  "sale"
                                                                ? "Sold"
                                                                : "Damaged"}{" "}
                                                            {
                                                                transaction.quantity
                                                            }{" "}
                                                            {unit}
                                                        </span>
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {transaction.date}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="w-48">View inventory analytics</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Badge
                        variant={
                            currentStock <= 10 ? "destructive" : "secondary"
                        }
                        className="text-xs px-2 py-0.5 font-medium"
                    >
                        {currentStock} {unit}{" "}
                        {currentStock <= 10 ? "Low Stock" : "In Stock"}
                    </Badge>
                </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
                Update inventory levels by recording stock transactions
            </DialogDescription>
        </DialogHeader>
    );
}
