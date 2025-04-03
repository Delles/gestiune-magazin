import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StockTransactionHistory from "../_components/history/stock-transaction-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import ItemDetailHeader from "./_components/item-detail-header";
import { Tables } from "@/types/supabase";
import ItemDetailHeaderSkeleton from "./_components/item-detail-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PrimaryMetrics } from "./_components/PrimaryMetrics";
import { PrimaryMetricsSkeleton } from "./_components/PrimaryMetricsSkeleton";
import { PurchaseCostHistoryTable } from "./_components/PurchaseCostHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Inventory Item Details",
    description: "View and manage inventory item details and stock history",
};

type FetchedItem = Tables<"InventoryItems"> & {
    categories: { name: string | null } | null;
};

// Helper function for displaying nullable numeric values
const formatNullableNumber = (
    value: number | null | undefined,
    suffix: string = ""
) => {
    if (value === null || value === undefined) return "N/A";
    return `${value}${suffix}`;
};

async function ItemDetailsContent({ itemId }: { itemId: string }) {
    const supabase = await createServerClient();

    const { data: item, error } = await supabase
        .from("InventoryItems")
        .select(
            `
            *,
            categories (
                name
            )
        `
        )
        .eq("id", itemId)
        .single<FetchedItem>();

    if (error || !item) {
        console.error(
            "Error fetching inventory item:",
            error?.message || "Item not found"
        );
        notFound();
    }

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
    };

    return (
        <>
            <ItemDetailHeader item={headerItemData} itemId={itemId} />

            <PrimaryMetrics {...primaryMetricsData} className="mb-6" />

            <Tabs defaultValue="details" className="w-full">
                <TabsList
                    className={cn(
                        "grid w-full grid-cols-2 md:w-[400px] mb-6",
                        "sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                        "top-[92px]",
                        "border-b"
                    )}
                >
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history-costing">
                        History & Costing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {item.description || "No description provided."}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Category
                                </span>
                                <Badge variant="outline">
                                    {item.categories?.name ?? "Uncategorized"}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Unit
                                </span>
                                <span>{item.unit}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Reorder Point
                                </span>
                                <span>
                                    {formatNullableNumber(
                                        item.reorder_point,
                                        ` ${item.unit}(s)`
                                    )}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Created At
                                </span>
                                <span>{formatDate(item.created_at)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Last Updated
                                </span>
                                <span>{formatDate(item.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history-costing" className="space-y-6">
                    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                        <PurchaseCostHistoryLoader itemId={itemId} />
                    </Suspense>

                    <StockTransactionHistory
                        itemId={item.id}
                        itemName={item.item_name}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
}

async function PurchaseCostHistoryLoader({ itemId }: { itemId: string }) {
    const supabase = await createServerClient();
    const { data: transactions, error } = await supabase
        .from("StockTransactions")
        .select("id, created_at, purchase_price")
        .eq("item_id", itemId)
        .in("transaction_type", ["purchase", "initial-stock"])
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching purchase history:", error);
        return <PurchaseCostHistoryTable transactions={[]} />;
    }

    return <PurchaseCostHistoryTable transactions={transactions ?? []} />;
}

export default async function InventoryItemPage({
    params,
}: {
    params: { itemId: string };
}) {
    const { itemId } = params;

    return (
        <div className="space-y-6">
            <Suspense
                fallback={
                    <>
                        <ItemDetailHeaderSkeleton />
                        <PrimaryMetricsSkeleton className="mb-6" />
                        <div className="w-full space-y-6">
                            <div className="grid w-full grid-cols-2 md:w-[400px] mb-6 h-10">
                                <Skeleton className="h-full w-full rounded-md" />
                                <Skeleton className="h-full w-full rounded-md" />
                            </div>
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </>
                }
            >
                <ItemDetailsContent itemId={itemId} />
            </Suspense>
        </div>
    );
}
