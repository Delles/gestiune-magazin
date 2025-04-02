import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import StockTransactionHistory from "../_components/history/stock-transaction-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import ItemDetailHeader from "./_components/item-detail-header";
import { Tables } from "@/types/supabase";
import ItemStatsGrid from "./_components/item-stats-grid";
import ItemAdditionalInfo from "./_components/item-additional-info";
import ItemDetailHeaderSkeleton from "./_components/item-detail-header-skeleton";
import ItemStatsGridSkeleton from "./_components/item-stats-grid-skeleton";
import ItemAdditionalInfoSkeleton from "./_components/item-additional-info-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Inventory Item Details",
    description: "View and manage inventory item details and stock history",
};

type FetchedItem = Tables<"InventoryItems"> & {
    categories: { name: string | null } | null;
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

    const isLowStock =
        item.reorder_point !== null &&
        item.stock_quantity <= item.reorder_point;

    const headerItemData = {
        id: item.id,
        item_name: item.item_name,
        unit: item.unit,
        categories: item.categories ? { name: item.categories.name } : null,
    };

    return (
        <>
            <ItemDetailHeader item={headerItemData} itemId={itemId} />

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">
                        Transaction History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <ItemStatsGrid
                        itemId={item.id}
                        itemName={item.item_name}
                        currentStock={item.stock_quantity}
                        unit={item.unit}
                        isLowStock={isLowStock}
                        reorderPoint={item.reorder_point}
                        lastPurchasePrice={item.last_purchase_price ?? 0}
                        averagePurchasePrice={item.average_purchase_price ?? 0}
                        sellingPrice={item.selling_price ?? 0}
                    />
                    <ItemAdditionalInfo
                        description={item.description}
                        reorderPoint={item.reorder_point}
                        unit={item.unit}
                        isLowStock={isLowStock}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <StockTransactionHistory
                        itemId={item.id}
                        itemName={item.item_name}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
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
                        <div className="w-full space-y-6 mt-6">
                            <div className="grid w-full grid-cols-2 md:w-[400px] mb-6 h-10">
                                <Skeleton className="h-full w-full" />
                                <Skeleton className="h-full w-full" />
                            </div>
                            <div className="space-y-6">
                                <ItemStatsGridSkeleton />
                                <ItemAdditionalInfoSkeleton />
                            </div>
                        </div>
                    </>
                }
            >
                <ItemDetailsContent itemId={itemId} />
            </Suspense>
        </div>
    );
}
