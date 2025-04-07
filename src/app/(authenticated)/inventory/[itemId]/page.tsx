import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { Tables } from "@/types/supabase";
import ItemDetailHeaderSkeleton from "./_components/item-detail-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PrimaryMetricsSkeleton } from "./_components/PrimaryMetricsSkeleton";
import { ItemDetailsClientSection } from "./_components/item-details-client-section";

export const metadata: Metadata = {
    title: "Inventory Item Details",
    description: "View and manage inventory item details and stock history",
};

type FetchedItem = Tables<"InventoryItems"> & {
    categories: { name: string | null } | null;
};

type PurchaseTransaction = {
    id: string;
    created_at: string;
    purchase_price: number | null;
};

export default async function InventoryItemPage({
    params,
}: {
    params: { itemId: string };
}) {
    const awaitedParams = await params;
    const { itemId } = awaitedParams;
    const supabase = await createServerClient();

    const { data: item, error: itemError } = await supabase
        .from("InventoryItems")
        .select(
            `
            *,
            categories ( name )
            `
        )
        .eq("id", itemId)
        .maybeSingle<FetchedItem>();

    const { data: purchaseHistory, error: historyError } = await supabase
        .from("StockTransactions")
        .select("id, created_at, purchase_price")
        .eq("item_id", itemId)
        .in("transaction_type", ["purchase", "initial-stock"])
        .order("created_at", { ascending: false })
        .limit(10);

    if (itemError || historyError || !item) {
        console.error(
            "Error fetching item page data:",
            itemError?.message || historyError?.message || "Item not found"
        );
        notFound();
    }

    const initialPurchaseHistory: PurchaseTransaction[] = purchaseHistory ?? [];

    return (
        <div className="space-y-6">
            <Suspense
                fallback={
                    <>
                        <ItemDetailHeaderSkeleton />
                        <PrimaryMetricsSkeleton className="mb-6" />
                        <div className="w-full space-y-6">
                            <div className="grid w-full grid-cols-2 md:w-[400px] mb-6 h-10 sticky top-[130px] z-20 border-b">
                                <Skeleton className="h-full w-full rounded-none" />
                                <Skeleton className="h-full w-full rounded-none" />
                            </div>
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </>
                }
            >
                <ItemDetailsClientSection
                    item={item}
                    itemId={itemId}
                    initialPurchaseHistory={initialPurchaseHistory}
                />
            </Suspense>
        </div>
    );
}
