import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import StockTransactionHistory from "../_components/stock-transaction-history";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    PackageIcon,
    ArrowLeftIcon,
    PlusIcon,
    MinusIcon,
    PencilIcon,
} from "lucide-react";
import { Metadata } from "next";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import StockAdjustmentForm from "../_components/stock-adjustment";
import EditFormContainer from "./edit-form-container";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export const metadata: Metadata = {
    title: "Inventory Item Details",
    description: "View and manage inventory item details and stock history",
};

export default async function InventoryItemPage({
    params,
}: {
    params: { itemId: string };
}) {
    // Get the item ID from the URL - await params according to Next.js 15 requirements
    const { itemId } = await params;
    const supabase = await createServerClient();

    // Fetch the item details
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
        .single();

    // If the item doesn't exist, show a 404 page
    if (error || !item) {
        console.error("Error fetching inventory item:", error);
        notFound();
    }

    // Format the monetary values
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/inventory">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Inventory
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Item Details Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <PackageIcon className="h-6 w-6 text-blue-500" />
                            <CardTitle>{item.item_name}</CardTitle>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Edit Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <EditFormContainer itemId={itemId} />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>
                        {item.categories?.name || "Uncategorized"} • {item.unit}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Purchase Price
                            </p>
                            <p className="text-xl font-semibold">
                                {formatCurrency(item.purchase_price)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Selling Price
                            </p>
                            <p className="text-xl font-semibold">
                                {formatCurrency(item.selling_price)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Current Stock
                            </p>
                            <div className="flex items-center space-x-4">
                                <p className="text-xl font-semibold">
                                    {item.stock_quantity} {item.unit}
                                </p>
                                <div className="flex space-x-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <PlusIcon className="h-4 w-4 mr-1" />
                                                Add Stock
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <DialogTitle>
                                                <VisuallyHidden>
                                                    Stock Adjustment for{" "}
                                                    {item.item_name}
                                                </VisuallyHidden>
                                            </DialogTitle>
                                            <StockAdjustmentForm
                                                itemId={item.id}
                                                itemName={item.item_name}
                                                currentStock={
                                                    item.stock_quantity
                                                }
                                                unit={item.unit}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <MinusIcon className="h-4 w-4 mr-1" />
                                                Reduce Stock
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <StockAdjustmentForm
                                                itemId={item.id}
                                                itemName={item.item_name}
                                                currentStock={
                                                    item.stock_quantity
                                                }
                                                unit={item.unit}
                                                initialType="decrease"
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </div>

                    {item.description && (
                        <div className="mt-6">
                            <p className="text-sm text-muted-foreground mb-1">
                                Description
                            </p>
                            <p className="text-sm">{item.description}</p>
                        </div>
                    )}

                    {item.reorder_point !== null && (
                        <div className="mt-6">
                            <p className="text-sm text-muted-foreground mb-1">
                                Reorder Point
                            </p>
                            <p className="text-sm">
                                {item.reorder_point} {item.unit}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction History */}
            <StockTransactionHistory
                itemId={item.id}
                itemName={item.item_name}
            />
        </div>
    );
}
