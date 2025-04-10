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
import { cn, formatDate, formatNullableNumber } from "@/lib/utils";
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

            <Tabs defaultValue="details" className="w-full">
                <TabsList
                    className={cn(
                        "grid w-full grid-cols-2 md:w-[400px] mb-6",
                        "sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                        "top-[92px]",
                        "border-b shadow-sm",
                        "transition-all duration-300"
                    )}
                >
                    <TabsTrigger
                        value="details"
                        className="transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-muted/60"
                    >
                        Detalii
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-muted/60"
                    >
                        Istoric
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="details"
                    className="space-y-6 animate-in fade-in-50 slide-in-from-left-1 duration-300"
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

                <TabsContent
                    value="history"
                    className="space-y-6 animate-in fade-in-50 slide-in-from-right-1 duration-300"
                >
                    <StockTransactionHistory
                        itemId={itemId}
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
                        <DialogTitle>Confirmare Ștergere</DialogTitle>
                        <DialogDescription>
                            Ești sigur că vrei să ștergi articolul &quot;
                            {item.item_name}&quot;? Această acțiune nu poate fi
                            anulată.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Anulează
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate([itemId])}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Ștergere..."
                                : "Șterge"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Stock Dialog */}
            <Dialog
                open={isAddStockDialogOpen}
                onOpenChange={setIsAddStockDialogOpen}
            >
                <DialogContent
                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <IncreaseStockForm
                        itemId={itemId}
                        itemName={item.item_name}
                        unit={item.unit}
                        currentStock={item.stock_quantity}
                        onSuccess={handleStockAdjustmentSuccess}
                        onClose={() => {
                            if (isMounted.current) {
                                setIsAddStockDialogOpen(false);
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Reduce Stock Dialog */}
            <Dialog
                open={isReduceStockDialogOpen}
                onOpenChange={setIsReduceStockDialogOpen}
            >
                <DialogContent
                    className="sm:max-w-[700px] p-0 border-0 max-h-[90vh] overflow-hidden flex flex-col"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DecreaseStockForm
                        itemId={itemId}
                        itemName={item.item_name}
                        unit={item.unit}
                        currentStock={item.stock_quantity}
                        averagePurchasePrice={item.average_purchase_price}
                        onSuccess={handleStockAdjustmentSuccess}
                        onClose={() => {
                            if (isMounted.current) {
                                setIsReduceStockDialogOpen(false);
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
