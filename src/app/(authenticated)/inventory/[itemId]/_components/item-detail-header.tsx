import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftIcon, Package, PencilIcon, MoreVertical } from "lucide-react";
import EditSheetWrapper from "./edit-sheet-wrapper"; // Assuming it's in the same directory
import { Tables } from "@/types/supabase"; // Assuming you have generated types
import { getCategoryIcon } from "@/lib/category-icons"; // Import the utility
import { cn } from "@/lib/utils"; // Ensure cn is imported

// Refined type - removed sku as it's not in the base type based on lint error
type ItemWithCategory = Pick<
    Tables<"InventoryItems">,
    | "id"
    | "item_name"
    | "unit"
    // | "sku" // Removed SKU based on lint error
    | "stock_quantity"
    | "reorder_point"
> & {
    categories: { name: string | null } | null;
};

interface ItemDetailHeaderProps {
    item: ItemWithCategory;
    itemId: string;
}

export default function ItemDetailHeader({
    item,
    itemId,
}: ItemDetailHeaderProps) {
    // Get the dynamic category icon component
    const CategoryIcon = getCategoryIcon(item.categories?.name);

    // Determine stock status
    const isLowStock =
        item.reorder_point !== null &&
        item.stock_quantity <= item.reorder_point &&
        item.stock_quantity > 0;
    const isOutOfStock = item.stock_quantity <= 0;

    return (
        // Wrap content in a div and apply sticky classes
        <div
            className={cn(
                "sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-4 mb-6 border-b"
                // Add top padding to account for potential overlap if main layout header is also sticky
                // Adjust top-0 if needed based on main app layout (e.g., top-14, top-16)
                // Added backdrop-blur for effect
                // Added pt-4 to prevent content jump when sticking
                // Added border-b to maintain visual separation when sticky
                // mb-6 remains to space out from content below when not sticky
            )}
        >
            {/* Back Navigation - add bottom margin if needed */}
            <div className="flex items-center space-x-2 mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory">
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Inventory
                    </Link>
                </Button>
            </div>

            {/* Item Header Content - Remove existing border-b and mb-6 from here */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Left Side: Info */}
                <div className="flex-1 space-y-2 min-w-0">
                    {/* Title Row with Status Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <CategoryIcon
                                className="h-6 w-6 text-muted-foreground flex-shrink-0"
                                aria-label={`${
                                    item.categories?.name ?? "Item"
                                } category icon`}
                            />
                            <span className="break-words">
                                {item.item_name ?? "Item Name"}
                            </span>
                        </h1>
                        {isOutOfStock && (
                            <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                            <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
                            >
                                Low Stock
                            </Badge>
                        )}
                    </div>
                    {/* Details Row - removed SKU */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <Badge variant="outline">
                            {item.categories?.name ?? "Uncategorized"}
                        </Badge>
                        <Separator
                            orientation="vertical"
                            className="h-4 mx-1"
                        />
                        <span>Unit: {item.unit}</span>
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
                    {/* TODO: Implement Adjust Stock Modal/Functionality */}
                    <Button variant="secondary" disabled>
                        Adjust Stock
                    </Button>

                    {/* Existing Edit Sheet Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline">
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0">
                            <SheetHeader className="p-6 pb-4">
                                <SheetTitle>Edit: {item.item_name}</SheetTitle>
                                <SheetDescription>
                                    Update item details. Unit and stock quantity
                                    cannot be changed here. Use stock
                                    adjustments for quantity changes.
                                </SheetDescription>
                            </SheetHeader>
                            <Separator />
                            <div className="p-6">
                                <EditSheetWrapper itemId={itemId} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                Delete Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div> // End of sticky wrapper div
    );
}
