import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { Tables } from "@/types/supabase";
import ItemDetailHeaderSkeleton from "./_components/item-detail-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDetailsClientSection } from "./_components/item-details-client-section";
import { unstable_noStore as noStore } from "next/cache";

// Import new skeletons
import { StockLevelCardSkeleton } from "./_components/StockLevelCardSkeleton";
import { PricingCardSkeleton } from "./_components/PricingCardSkeleton";
import { ProfitabilityCardSkeleton } from "./_components/ProfitabilityCardSkeleton";

export const metadata: Metadata = {
    title: "Inventory Item Details",
    description: "View and manage inventory item details and stock history",
};

interface PageProps {
    params: Promise<{ itemId: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

type FetchedItem = Tables<"InventoryItems"> & {
    categories: { name: string | null } | null;
};

export default async function InventoryItemPage(props: PageProps) {
    noStore(); // Prevent caching for dynamic data

    // In Next.js 15, params is a Promise that needs to be awaited
    const params = await props.params;
    const { itemId } = params;

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

    const { data: lastTwoPurchases, error: historyError } = await supabase
        .from("StockTransactions")
        .select("id, created_at, purchase_price")
        .eq("item_id", itemId)
        .in("transaction_type", ["purchase", "initial-stock"])
        .not("purchase_price", "is", null)
        .order("created_at", { ascending: false })
        .limit(2);

    const { data: transactionHistory, error: fullHistoryError } = await supabase
        .from("StockTransactions")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (itemError || historyError || fullHistoryError || !item) {
        console.error(
            "Error fetching item page data:",
            itemError?.message ||
                historyError?.message ||
                fullHistoryError?.message ||
                "Item not found"
        );
        notFound();
    }

    const secondLastPurchasePrice =
        lastTwoPurchases?.[1]?.purchase_price ?? null;

    const initialTransactionHistory: Tables<"StockTransactions">[] =
        transactionHistory ?? [];

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500 bg-gradient-to-b from-background to-muted/20 rounded-lg p-1">
            <Suspense
                fallback={
                    <>
                        <ItemDetailHeaderSkeleton />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            <StockLevelCardSkeleton className="xl:col-span-1" />
                            <div className="md:col-span-1 lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <PricingCardSkeleton className="md:col-span-1" />
                                <ProfitabilityCardSkeleton className="md:col-span-2" />
                            </div>
                        </div>
                        <div className="w-full space-y-6">
                            <div className="grid w-full grid-cols-2 md:w-[400px] mb-6 h-10 sticky top-[92px] z-20 border-b shadow-sm">
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
                    secondLastPurchasePrice={secondLastPurchasePrice}
                    initialTransactionHistory={initialTransactionHistory}
                />
            </Suspense>
        </div>
    );
}
