"use client";

import { useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    PlusCircle,
    ArrowUpDown,
    Search,
    Package,
    Pencil,
    BarChart4,
    Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import InventoryItemForm from "./inventory-item-form";
import StockAdjustmentForm from "./stock-adjustment-form";
import { useRouter } from "next/navigation";

// Define a type for our simplified inventory items
type InventoryItem = {
    id: string;
    item_name: string;
    category_id: string | null;
    category_name?: string; // Joined from categories table
    unit: string;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    created_at: string;
    updated_at: string;
};

// Fetch inventory items from our API
async function getInventoryItems(): Promise<InventoryItem[]> {
    const response = await fetch("/api/inventory/items");
    if (!response.ok) {
        throw new Error("Failed to fetch inventory items");
    }
    return response.json();
}

export default function InventoryList() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [adjustingStockItem, setAdjustingStockItem] =
        useState<InventoryItem | null>(null);
    const router = useRouter();

    // Function to handle edit action
    const handleEdit = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        setEditingItemId(itemId);
    };

    // Function to handle stock adjustment
    const handleAdjustStock = (e: React.MouseEvent, item: InventoryItem) => {
        e.stopPropagation();
        setAdjustingStockItem(item);
    };

    // Function to navigate to item details
    const handleViewDetails = (itemId: string) => {
        router.push(`/inventory/${itemId}`);
    };

    // Define columns for the table based on US-VSIM-001 requirements
    const columns: ColumnDef<InventoryItem>[] = [
        {
            accessorKey: "item_name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="px-0 font-medium"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Item Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2 font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {row.getValue("item_name")}
                    </div>
                );
            },
        },
        {
            accessorKey: "category_name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="px-0 font-medium"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                return (
                    <Badge variant="secondary" className="font-normal">
                        {row.getValue("category_name") || "Uncategorized"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "unit",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="px-0 font-medium"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Unit
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                return (
                    <span className="text-muted-foreground">
                        {row.getValue("unit")}
                    </span>
                );
            },
        },
        {
            accessorKey: "purchase_price",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                    className="text-right w-full justify-end font-medium"
                >
                    Purchase Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("purchase_price"));
                return (
                    <div className="text-right font-mono">
                        ${price.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: "selling_price",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                    className="text-right w-full justify-end font-medium"
                >
                    Selling Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("selling_price"));
                return (
                    <div className="text-right font-mono text-green-600 dark:text-green-400">
                        ${price.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: "stock_quantity",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                    className="text-right w-full justify-end font-medium"
                >
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const item = row.original;
                const quantity = item.stock_quantity;

                let stockClass = "text-muted-foreground";
                if (quantity <= 10) {
                    stockClass = "text-red-600 dark:text-red-400 font-medium";
                } else if (quantity <= 20) {
                    stockClass = "text-yellow-600 dark:text-yellow-400";
                }

                return (
                    <div className={`text-right ${stockClass}`}>
                        {quantity} {item.unit}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEdit(e, item.id)}
                            title="Edit Item"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleAdjustStock(e, item)}
                            title="Adjust Stock"
                        >
                            <BarChart4 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(item.id);
                            }}
                            title="View Details"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    // Fetch inventory items
    const {
        data: inventoryItems = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["inventoryItems"],
        queryFn: getInventoryItems,
    });

    // Set up the table
    const table = useReactTable({
        data: inventoryItems,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter,
        },
    });

    // Handle dialog close
    const handleDialogClose = () => {
        setIsAddDialogOpen(false);
        setEditingItemId(null);
        setAdjustingStockItem(null);
    };

    // Display error if there is one
    if (isError) {
        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-semibold">Error</h3>
                <p className="text-destructive">{error?.message}</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Inventory</CardTitle>
                        <CardDescription>
                            Manage your inventory items and stock levels
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search inventory..."
                                value={globalFilter ?? ""}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="pl-8 md:w-[200px] lg:w-[300px]"
                            />
                        </div>
                        <Dialog
                            open={isAddDialogOpen}
                            onOpenChange={setIsAddDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="whitespace-nowrap">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add New Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <InventoryItemForm
                                    onSuccess={handleDialogClose}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    // Loading skeleton
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="w-full h-12 rounded-md"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                            onClick={() =>
                                                handleViewDetails(
                                                    row.original.id
                                                )
                                            }
                                            className="cursor-pointer transition-colors hover:bg-muted/40"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No inventory items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <strong>
                            {table.getState().pagination.pageIndex *
                                table.getState().pagination.pageSize +
                                1}
                        </strong>
                        {" - "}
                        <strong>
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) *
                                    table.getState().pagination.pageSize,
                                table.getRowCount()
                            )}
                        </strong>{" "}
                        of <strong>{table.getRowCount()}</strong> items
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Stock adjustment dialog */}
            {adjustingStockItem && (
                <Dialog
                    open={!!adjustingStockItem}
                    onOpenChange={(open) => {
                        if (!open) setAdjustingStockItem(null);
                    }}
                >
                    <DialogContent>
                        <StockAdjustmentForm
                            itemId={adjustingStockItem.id}
                            itemName={adjustingStockItem.item_name}
                            unit={adjustingStockItem.unit}
                            currentStock={adjustingStockItem.stock_quantity}
                            onSuccess={handleDialogClose}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit item dialog */}
            {editingItemId && (
                <Dialog
                    open={!!editingItemId}
                    onOpenChange={(open) => {
                        if (!open) setEditingItemId(null);
                    }}
                >
                    <DialogContent>
                        <InventoryItemForm
                            itemId={editingItemId}
                            onSuccess={handleDialogClose}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}
