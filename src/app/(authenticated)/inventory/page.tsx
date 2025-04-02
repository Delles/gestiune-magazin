// src/app/(authenticated)/inventory/page.tsx
import { Metadata } from "next";
import InventoryList from "./_components/list/inventory-list";
import { createServerClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, PackageCheck, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Inventory Management",
    description: "Manage your inventory items",
};

async function getInventoryStats() {
    noStore();
    const supabase = await createServerClient();
    // RLS implicitly filters by user_id if set up correctly
    const { data, error, count } = await supabase
        .from("InventoryItems")
        .select("stock_quantity, reorder_point", {
            count: "exact",
            head: false,
        }); // Fetch only necessary fields for stats

    if (error) {
        console.error("Error fetching inventory stats:", error);
        return { totalItems: 0, lowStockCount: 0, outOfStockCount: 0 };
    }

    const lowStockCount = data.filter(
        (item) =>
            item.reorder_point !== null &&
            item.stock_quantity <= item.reorder_point &&
            item.stock_quantity > 0
    ).length;
    const outOfStockCount = data.filter(
        (item) => item.stock_quantity <= 0
    ).length;

    return { totalItems: count ?? 0, lowStockCount, outOfStockCount };
}

export default async function InventoryPage() {
    const stats = await getInventoryStats();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Inventory Overview
                    </h1>
                    <p className="text-muted-foreground">
                        View, manage, and organize your stock items.
                    </p>
                </div>
                {/* Add any page-level actions here if needed later */}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link
                    href="/inventory"
                    className="hover:opacity-90 transition-opacity"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Items
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalItems}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Different products tracked
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link
                    href="/inventory?status=low_stock"
                    className="hover:opacity-90 transition-opacity"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Low Stock Items
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.lowStockCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Items at or below reorder point
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link
                    href="/inventory?status=out_of_stock"
                    className="hover:opacity-90 transition-opacity"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Out of Stock
                            </CardTitle>
                            <PackageCheck className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.outOfStockCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Items with zero quantity
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Separator />

            {/* Inventory List Component */}
            <InventoryList />
        </div>
    );
}
