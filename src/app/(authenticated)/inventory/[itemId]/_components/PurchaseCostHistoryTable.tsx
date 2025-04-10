"use client";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tables } from "@/types/supabase"; // Import Supabase types
import { format } from "date-fns"; // Use date-fns as per rules
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Helper function for currency formatting (consider moving to utils if reused)
const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD", // TODO: Make currency dynamic if needed
    }).format(value);
};

// Define the expected shape for transaction data needed by this component
// We only expect purchase-related transactions here
type PurchaseTransaction = Pick<
    Tables<"StockTransactions">, // Use Supabase table type
    "id" | "created_at" | "purchase_price"
>;

interface PurchaseCostHistoryTableProps {
    transactions: PurchaseTransaction[];
    className?: string;
    maxRows?: number;
}

export function PurchaseCostHistoryTable({
    transactions,
    className,
    maxRows = 5, // Default to showing latest 5
}: PurchaseCostHistoryTableProps) {
    // Ensure we only take the latest transactions up to maxRows
    const displayedTransactions = transactions.slice(0, maxRows);

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Recent Purchase Costs</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">
                                Purchase Price
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedTransactions.length > 0 ? (
                            displayedTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        {format(
                                            new Date(transaction.created_at),
                                            "yyyy-MM-dd" // Example format
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            transaction.purchase_price
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    className="text-center text-muted-foreground"
                                >
                                    No purchase history available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {displayedTransactions.length > 0 && (
                        <TableCaption>
                            Showing the last {displayedTransactions.length}{" "}
                            purchase transactions.
                        </TableCaption>
                    )}
                </Table>
            </CardContent>
        </Card>
    );
}
