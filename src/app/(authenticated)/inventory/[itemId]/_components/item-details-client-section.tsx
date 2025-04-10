"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatNullableNumber } from "@/lib/utils";
import { Tables } from "@/types/supabase";
import {
    deleteInventoryItems,
    updateItemReorderPoint,
} from "@/app/(authenticated)/inventory/_data/api";
import StockTransactionHistory from "@/app/(authenticated)/inventory/_components/history/stock-transaction-history";
import ItemDetailHeader from "./item-detail-header";
import { StockLevelCard } from "./StockLevelCard";
import { PricingCard } from "./PricingCard";
import { ProfitabilityCard } from "./ProfitabilityCard";
import {
    calculateInventoryMetrics,
    type MetricInputs,
    type CalculatedMetrics,
} from "@/lib/inventoryUtils";
import IncreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/IncreaseStockForm";
import DecreaseStockForm from "@/app/(authenticated)/inventory/_components/stock-adjustment/DecreaseStockForm";
import { cn } from "@/lib/utils";

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

export function ItemDetailsClientSection({
    item,
    itemId,
    secondLastPurchasePrice,
    initialTransactionHistory,
}: ItemDetailsClientSectionProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
    const [isReduceStockDialogOpen, setIsReduceStockDialogOpen] =
        useState(false);
    const isMounted = useRef(true);

    // Set up effect to track component mount status
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

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
            toast.success("Articol șters cu succes.");
            // Invalidate cache for the list view
            queryClient.invalidateQueries({
                queryKey: ["inventoryItems", "list"],
            });
            // Use router.push in a setTimeout to ensure it happens after the current render cycle
            setTimeout(() => {
                router.push("/inventory"); // Redirect to inventory list
            }, 0);
        },
        onError: (error) => {
            toast.error(`Eroare la ștergerea articolului: ${error.message}`);
            if (isMounted.current) {
                setIsDeleteDialogOpen(false); // Close dialog on error
            }
        },
    });

    // --- Reorder Point Mutation ---
    const updateReorderPointMutation = useMutation({
        mutationFn: ({
            id,
            reorder_point,
        }: {
            id: string;
            reorder_point: number | null;
        }) => updateItemReorderPoint(id, reorder_point),
        onSuccess: () => {
            toast.success(
                "Punctul de reaprovizionare a fost actualizat cu succes."
            );
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", itemId],
            });
            // No need to invalidate stockTransactions here
        },
        onError: (error) => {
            toast.error(
                `Nu s-a putut actualiza punctul de reaprovizionare: ${error.message}`
            );
        },
    });

    // --- Callbacks for StockLevelCard ---
    const handleSaveReorderPoint = (data: { reorder_point: number | null }) => {
        updateReorderPointMutation.mutate({
            id: itemId,
            reorder_point: data.reorder_point,
        });
    };
    const handleOpenAddStock = () => setIsAddStockDialogOpen(true);
    const handleOpenReduceStock = () => setIsReduceStockDialogOpen(true);

    // --- Stock Adjustment Success Handler (for dialogs) ---
    const handleStockAdjustmentSuccess = () => {
        if (isMounted.current) {
            setIsAddStockDialogOpen(false);
            setIsReduceStockDialogOpen(false);
        }
        queryClient.invalidateQueries({ queryKey: ["inventoryItem", itemId] });
        queryClient.invalidateQueries({
            queryKey: ["stockTransactions", itemId],
        });
    };

    // --- Data for Components ---
    const headerItemData = {
        id: item.id,
        item_name: item.item_name,
        unit: item.unit,
        stock_quantity: item.stock_quantity,
        reorder_point: item.reorder_point,
        categories: item.categories ? { name: item.categories.name } : null,
    };

    // Calculate metrics using the helper function
    const metricInputs: MetricInputs = {
        stock_quantity: item.stock_quantity,
        selling_price: item.selling_price,
        average_purchase_price: item.average_purchase_price,
        last_purchase_price: item.last_purchase_price,
        secondLastPurchasePrice: secondLastPurchasePrice,
    };
    const calculatedMetrics: CalculatedMetrics =
        calculateInventoryMetrics(metricInputs);

    // --- Render ---
    return (
        <>
            <ItemDetailHeader
                item={headerItemData}
                itemId={itemId}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
            />

            {/* New Metric Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                <StockLevelCard
                    itemId={itemId}
                    itemName={item.item_name}
                    stock_quantity={item.stock_quantity}
                    reorder_point={item.reorder_point}
                    unit={item.unit}
                    onAddStockClick={handleOpenAddStock}
                    onReduceStockClick={handleOpenReduceStock}
                    onSaveReorderPoint={handleSaveReorderPoint}
                    isSavingReorderPoint={updateReorderPointMutation.isPending}
                    className="xl:col-span-1"
                />
                <div className="md:col-span-1 lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PricingCard
                        selling_price={item.selling_price}
                        average_purchase_price={item.average_purchase_price}
                        last_purchase_price={item.last_purchase_price}
                        lastVsAvgDiffPercent={
                            calculatedMetrics.lastVsAvgDiffPercent
                        }
                        lastVsSecondLastDiffValue={
                            calculatedMetrics.lastVsSecondLastDiffValue
                        }
                        unit={item.unit}
                        className="md:col-span-1"
                    />
                    <ProfitabilityCard
                        estimatedStockValue={
                            calculatedMetrics.estimatedStockValue
                        }
                        profitPerUnit={calculatedMetrics.profitPerUnit}
                        profitMargin={calculatedMetrics.profitMargin}
                        markup={calculatedMetrics.markup}
                        unit={item.unit}
                        className="md:col-span-2"
                    />
                </div>
            </div>

            {/* Keep Tabs structure but restore original Details content and correct History props */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList
                    className={cn(
                        "grid w-full grid-cols-3 md:w-[600px] mb-6 h-10 sticky top-[92px] z-20",
                        "border-b border-border shadow-soft-sm",
                        "bg-muted/80 dark:bg-muted/40 rounded-lg"
                    )}
                >
                    {/* Details Tab Trigger */}
                    <TabsTrigger
                        value="details"
                        className={cn(
                            "rounded-md transition-all duration-200 ease-in-out",
                            "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold",
                            "data-[state=active]:bg-background data-[state=active]:shadow-soft-sm"
                        )}
                    >
                        Detalii
                    </TabsTrigger>
                    {/* History Tab Trigger */}
                    <TabsTrigger
                        value="history"
                        className={cn(
                            "rounded-md transition-all duration-200 ease-in-out",
                            "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold",
                            "data-[state=active]:bg-background data-[state=active]:shadow-soft-sm"
                        )}
                    >
                        Istoric Tranzacții
                    </TabsTrigger>
                    {/* Analytics Tab Trigger */}
                    <TabsTrigger
                        value="analytics"
                        disabled
                        className={cn(
                            "rounded-md transition-all duration-200 ease-in-out",
                            "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold",
                            "data-[state=active]:bg-background data-[state=active]:shadow-soft-sm"
                        )}
                    >
                        Analiză (în curând)
                    </TabsTrigger>
                </TabsList>

                {/* Details Tab Content (Restored) */}
                <TabsContent
                    value="details"
                    className="space-y-6 animate-in fade-in-50 duration-300 mt-4"
                >
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent inline-block">
                            Descriere
                        </h3>
                        <p className="text-sm text-muted-foreground pl-2 border-l-2 border-primary/20 py-1">
                            {item.description || "Nicio descriere introdusă."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent inline-block">
                            Informații suplimentare
                        </h3>
                        {/* Use MetricDisplayCard styling concept here? Or keep simpler list? */}
                        {/* Keeping simpler list for now, can enhance later */}
                        <dl className="space-y-3 border p-4 rounded-lg bg-muted/40 shadow-sm hover:shadow transition-all duration-300 hover:bg-muted/50">
                            <div className="flex justify-between items-center text-sm hover:bg-muted/50 p-1 rounded-md transition-colors duration-200">
                                <dt className="text-muted-foreground">
                                    Categorie
                                </dt>
                                <dd>
                                    <Badge variant="outline">
                                        {item.categories?.name ??
                                            "Necategorizat"}
                                    </Badge>
                                </dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm hover:bg-muted/50 p-1 rounded-md transition-colors duration-200">
                                <dt className="text-muted-foreground">
                                    Unitate de măsură
                                </dt>
                                <dd>{item.unit}</dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm hover:bg-muted/50 p-1 rounded-md transition-colors duration-200">
                                <dt className="text-muted-foreground">
                                    Punct de reaprovizionare
                                </dt>
                                <dd>
                                    {formatNullableNumber(
                                        item.reorder_point,
                                        ` ${item.unit}(i)`
                                    )}
                                </dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm hover:bg-muted/50 p-1 rounded-md transition-colors duration-200">
                                <dt className="text-muted-foreground">
                                    Creat la
                                </dt>
                                <dd>{formatDate(item.created_at)}</dd>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-sm hover:bg-muted/50 p-1 rounded-md transition-colors duration-200">
                                <dt className="text-muted-foreground">
                                    Actualizat ultima dată
                                </dt>
                                <dd>{formatDate(item.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </TabsContent>

                {/* History Tab Content (Corrected Props) */}
                <TabsContent value="history" className="mt-4">
                    <StockTransactionHistory
                        itemId={itemId}
                        itemName={item.item_name}
                        currentStock={item.stock_quantity}
                        transactions={initialTransactionHistory} // Correct prop name
                        unit={item.unit}
                    />
                </TabsContent>

                {/* Analytics Tab Content (Keep as is) */}
                <TabsContent value="analytics" className="mt-4">
                    <p className="text-center text-muted-foreground p-8">
                        Secțiunea de analiză detaliată va fi disponibilă în
                        curând.
                    </p>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className="sm:max-w-md border border-border bg-gradient-to-b from-card to-card/95 dark:from-card dark:to-card/90 shadow-soft-lg">
                    <DialogHeader>
                        <DialogTitle>Confirmare Ștergere</DialogTitle>
                        <DialogDescription>
                            Ești sigur că vrei să ștergi articolul &quot;
                            <span className="font-semibold text-foreground">
                                {item.item_name}
                            </span>
                            &quot;? Această acțiune este ireversibilă și va
                            șterge și tot istoricul asociat.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                                "border border-black/10 dark:border-white/15",
                                "hover:bg-accent/50 active:bg-accent/70",
                                "hover:scale-[1.02] active:scale-[0.98]",
                                "transition-all duration-150 ease-in-out"
                            )}
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Anulează
                        </Button>
                        <Button
                            variant="destructive"
                            className={cn(
                                "shadow-soft-md hover:shadow-soft-lg active:shadow-soft-inner",
                                "hover:scale-[1.02] active:scale-[0.98]",
                                "transition-all duration-150 ease-in-out"
                            )}
                            onClick={() => deleteMutation.mutate([itemId])}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Ștergere..."
                                : "Șterge Articolul"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Stock Dialog */}
            <Dialog
                open={isAddStockDialogOpen}
                onOpenChange={setIsAddStockDialogOpen}
            >
                <DialogContent className="sm:max-w-lg border border-border bg-gradient-to-b from-card to-card/95 dark:from-card dark:to-card/90 shadow-soft-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Creștere Stoc: {item.item_name}
                        </DialogTitle>
                        <DialogDescription>
                            Înregistrează o nouă achiziție sau o altă formă de
                            adăugare în stoc.
                        </DialogDescription>
                    </DialogHeader>
                    <IncreaseStockForm
                        itemId={itemId}
                        itemName={item.item_name}
                        unit={item.unit}
                        currentStock={item.stock_quantity}
                        onSuccess={handleStockAdjustmentSuccess}
                        onClose={() => setIsAddStockDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Reduce Stock Dialog */}
            <Dialog
                open={isReduceStockDialogOpen}
                onOpenChange={setIsReduceStockDialogOpen}
            >
                <DialogContent className="sm:max-w-lg border border-border bg-gradient-to-b from-card to-card/95 dark:from-card dark:to-card/90 shadow-soft-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Reducere Stoc: {item.item_name}
                        </DialogTitle>
                        <DialogDescription>
                            Înregistrează o vânzare, consum, pierdere sau altă
                            formă de reducere a stocului.
                        </DialogDescription>
                    </DialogHeader>
                    <DecreaseStockForm
                        itemId={itemId}
                        itemName={item.item_name}
                        unit={item.unit}
                        currentStock={item.stock_quantity}
                        averagePurchasePrice={item.average_purchase_price}
                        onSuccess={handleStockAdjustmentSuccess}
                        onClose={() => setIsReduceStockDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
