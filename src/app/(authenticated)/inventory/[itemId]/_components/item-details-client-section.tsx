"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import { Tables } from "@/types/supabase";
import { deleteInventoryItems } from "@/app/(authenticated)/inventory/_data/api"; // Assuming API function path
import StockTransactionHistory from "@/app/(authenticated)/inventory/_components/history/stock-transaction-history";
import ItemDetailHeader from "./item-detail-header";
import { PrimaryMetrics } from "./PrimaryMetrics";
// import { PurchaseCostHistoryTable } from "./PurchaseCostHistoryTable"; // Commented out - passing data now

// Type for the item data passed from the server component
type FetchedItem = Tables<"InventoryItems"> & {
    categories: { name: string | null } | null;
};

interface ItemDetailsClientSectionProps {
    item: FetchedItem;
    itemId: string;
    secondLastPurchasePrice: number | null;
    initialTransactionHistory: Tables<"StockTransactions">[];
}

// Helper function for displaying nullable numeric values (copied from page.tsx)
const formatNullableNumber = (
    value: number | null | undefined,
    suffix: string = ""
) => {
    if (value === null || value === undefined) return "N/A";
    return `${value}${suffix}`;
};

export function ItemDetailsClientSection({
    item,
    itemId,
    secondLastPurchasePrice,
    initialTransactionHistory,
}: ItemDetailsClientSectionProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // --- Delete Mutation ---
    const deleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            try {
                const result: unknown = await deleteInventoryItems(ids); // Call API, type as unknown initially

                // Check if result has an error property that is truthy
                // Using type checking instead of assertion
                if (
                    result &&
                    typeof result === "object" &&
                    "error" in result &&
                    result.error
                ) {
                    const errorObj = result.error;
                    let message = "Unknown delete error";
                    // Check if errorObj itself is the message or has a message property
                    if (typeof errorObj === "string") {
                        message = errorObj;
                    } else if (
                        errorObj &&
                        typeof errorObj === "object" &&
                        "message" in errorObj &&
                        typeof errorObj.message === "string"
                    ) {
                        message = errorObj.message;
                    }
                    throw new Error(String(message));
                }

                // If no error thrown and no error property, assume success
                return ids;
            } catch (err) {
                // Catch errors thrown by deleteInventoryItems or the manual throw above
                const message =
                    err instanceof Error ? err.message : String(err);
                console.error("Delete mutation error:", message); // Optional logging
                // Re-throw a new error to be caught by onError
                throw new Error(`Failed to delete item: ${message}`);
            }
        },
        onSuccess: () => {
            toast.success("Item deleted successfully.");
            // Invalidate cache for the list view
            queryClient.invalidateQueries({
                queryKey: ["inventoryItems", "list"],
            });
            // Optionally invalidate the specific item, though we're redirecting anyway
            // queryClient.invalidateQueries({ queryKey: ['inventoryItem', itemId] });
            router.push("/inventory"); // Redirect to inventory list
        },
        onError: (error) => {
            toast.error(`Failed to delete item: ${error.message}`);
            setIsDeleteDialogOpen(false); // Close dialog on error
        },
    });

    // --- Data for Components ---
    const headerItemData = {
        id: item.id,
        item_name: item.item_name,
        unit: item.unit,
        stock_quantity: item.stock_quantity,
        reorder_point: item.reorder_point,
        categories: item.categories ? { name: item.categories.name } : null,
    };

    const primaryMetricsData = {
        itemId: itemId,
        stock_quantity: item.stock_quantity,
        reorder_point: item.reorder_point,
        unit: item.unit,
        selling_price: item.selling_price,
        average_purchase_price: item.average_purchase_price,
        last_purchase_price: item.last_purchase_price,
        secondLastPurchasePrice: secondLastPurchasePrice,
    };

    // --- Render ---
    return (
        <>
            <ItemDetailHeader
                item={headerItemData}
                itemId={itemId}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
            />

            <PrimaryMetrics
                {...primaryMetricsData}
                itemName={item.item_name}
                className="mb-6"
            />

            <Tabs defaultValue="details" className="w-full">
                <TabsList
                    className={cn(
                        "grid w-full grid-cols-2 md:w-[400px] mb-6",
                        "sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                        // The ItemDetailHeader is sticky at top-0 with pt-4 and pb-4 (32px total),
                        // plus the content height and any margins. From examining the component,
                        // a safe estimate would be around 92px total for the header.
                        "top-[92px]",
                        "border-b"
                    )}
                >
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Properties</h3>
                        <p className="text-sm text-muted-foreground pl-2">
                            {item.description || "No description provided."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Metadata</h3>
                        <dl className="space-y-3 border p-4 rounded-lg bg-muted/40">
                            <div className="flex justify-between items-center text-sm">
                                <dt className="text-muted-foreground">
                                    Category
                                </dt>
                                <dd>
                                    <Badge variant="outline">
                                        {item.categories?.name ??
                                            "Uncategorized"}
                                    </Badge>
                                </dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <dt className="text-muted-foreground">Unit</dt>
                                <dd>{item.unit}</dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <dt className="text-muted-foreground">
                                    Reorder Point
                                </dt>
                                <dd>
                                    {formatNullableNumber(
                                        item.reorder_point,
                                        ` ${item.unit}(s)`
                                    )}
                                </dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <dt className="text-muted-foreground">
                                    Created At
                                </dt>
                                <dd>{formatDate(item.created_at)}</dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <dt className="text-muted-foreground">
                                    Last Updated
                                </dt>
                                <dd>{formatDate(item.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <StockTransactionHistory
                        itemId={item.id}
                        itemName={item.item_name}
                        currentStock={item.stock_quantity}
                        transactions={initialTransactionHistory}
                        unit={item.unit}
                    />
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the item &quot;
                            {item.item_name}&quot;? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                disabled={deleteMutation.isPending}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate([itemId])}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
