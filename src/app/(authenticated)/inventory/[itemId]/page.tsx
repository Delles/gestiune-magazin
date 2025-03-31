import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import StockTransactionHistory from "../_components/stock-transaction-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ArrowLeftIcon,
    PlusIcon,
    MinusIcon,
    PencilIcon,
    DollarSign,
    Warehouse, // Icon for stock
    AlertCircle, // Icon for reorder point
    Info, // Icon for description
    Package, // Icon for unit/category
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
import { cn } from "@/lib/utils"; // Import cn utility
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet";

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
    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // Replace with dynamic currency later from settings
        }).format(value);
    };

    const isLowStock =
        item.reorder_point !== null &&
        item.stock_quantity <= item.reorder_point;

    return (
        <div className="space-y-6">
            {/* Back Navigation */}
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory">
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Inventory
                    </Link>
                </Button>
            </div>

            {/* Item Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        {/* Consider adding an icon based on category later */}
                        {item.item_name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <Badge variant="outline">
                            {item.categories?.name || "Uncategorized"}
                        </Badge>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Unit: {item.unit}</span>
                    </div>
                </div>

                {/* Replace Dialog with Sheet for Edit */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">
                            <PencilIcon className="mr-2 h-4 w-4" /> Edit Item
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0">
                        <SheetHeader className="p-6 pb-4">
                            <SheetTitle>Edit: {item.item_name}</SheetTitle>
                            <SheetDescription>
                                Update item details. Unit and stock quantity
                                cannot be changed.
                            </SheetDescription>
                        </SheetHeader>
                        <Separator />
                        <div className="p-6">
                            <EditFormContainer itemId={itemId} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">
                        Transaction History
                    </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Current Stock Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Current Stock
                                </CardTitle>
                                <Warehouse className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div
                                    className={cn(
                                        "text-2xl font-bold",
                                        isLowStock && "text-destructive"
                                    )}
                                >
                                    {item.stock_quantity} {item.unit}
                                </div>
                                {isLowStock && (
                                    <p className="text-xs text-destructive flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Stock is at or below reorder point (
                                        {item.reorder_point} {item.unit})
                                    </p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">
                                                <PlusIcon className="mr-1 h-4 w-4" />
                                                Add
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
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
                                                initialType="increase" // Default
                                            />
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant={
                                                    isLowStock
                                                        ? "destructive"
                                                        : "outline"
                                                }
                                                disabled={
                                                    item.stock_quantity <= 0
                                                } // Disable if no stock
                                            >
                                                <MinusIcon className="mr-1 h-4 w-4" />
                                                Reduce
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
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
                                                initialType="decrease" // Set explicitly
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Purchase Price Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Purchase Price
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(item.purchase_price)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Cost per unit
                                </p>
                            </CardContent>
                        </Card>

                        {/* Selling Price Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Selling Price
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(item.selling_price)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Revenue per unit
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Optional Details Section */}
                    {(item.description || item.reorder_point !== null) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {item.reorder_point !== null && (
                                    <div className="flex items-start space-x-3">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertCircle
                                                        className={cn(
                                                            "h-5 w-5 mt-0.5",
                                                            isLowStock
                                                                ? "text-destructive"
                                                                : "text-muted-foreground"
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Reorder Point</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div>
                                            <p className="text-sm font-medium">
                                                Reorder Point
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.reorder_point} {item.unit}{" "}
                                                (Trigger for re-stocking)
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {item.description && (
                                    <div className="flex items-start space-x-3">
                                        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Description
                                            </p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    {/* Render history component directly */}
                    <StockTransactionHistory
                        itemId={item.id}
                        itemName={item.item_name}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
