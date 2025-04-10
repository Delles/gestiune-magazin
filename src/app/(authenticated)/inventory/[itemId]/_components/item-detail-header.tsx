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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftIcon, MoreVertical, Package, PencilIcon } from "lucide-react";
import EditSheetWrapper from "./edit-sheet-wrapper"; // Assuming it's in the same directory
import { Tables } from "@/types/supabase"; // Assuming you have generated types
import { getCategoryIcon } from "@/lib/category-icons"; // Import the utility
import { cn } from "@/lib/utils"; // Ensure cn is imported
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    onDeleteClick: () => void;
}

export default function ItemDetailHeader({
    item,
    itemId,
    onDeleteClick,
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
        <div
            className={cn(
                "sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 pt-4 pb-4",
                "border-b border-border shadow-soft-sm"
            )}
        >
            {/* Back Navigation */}
            <div className="flex items-center space-x-2 mb-6">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className={cn(
                        "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                        "border border-black/10 dark:border-white/15",
                        "hover:bg-accent/50 active:bg-accent/70",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        "transition-all duration-150 ease-in-out",
                        "group"
                    )}
                >
                    <Link href="/inventory">
                        <ArrowLeftIcon className="mr-1 h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                        Back to Inventory
                    </Link>
                </Button>
            </div>

            {/* Item Header Content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                {/* Left Side: Info */}
                <div className="flex-1 space-y-2 min-w-0">
                    {/* Title Row with Status Badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div
                            className={cn(
                                "bg-gradient-to-br from-muted to-muted/80 dark:from-muted/80 dark:to-muted/60 p-2 rounded-lg flex-shrink-0",
                                "shadow-soft-inner hover:shadow-soft-sm",
                                "border border-black/5 dark:border-white/5",
                                "transition-all duration-300 group"
                            )}
                        >
                            <CategoryIcon
                                className="h-6 w-6 text-muted-foreground group-hover:text-primary/80 transition-colors duration-300"
                                aria-label={`${
                                    item.categories?.name ?? "Item"
                                } category icon`}
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            <span className="break-words">
                                {item.item_name ?? "Item Name"}
                            </span>
                        </h1>
                        {isOutOfStock && (
                            <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                            <Badge
                                variant="outline"
                                className="bg-amber-500/15 text-amber-600 border-amber-500/20 dark:bg-amber-600/10 dark:text-amber-400 dark:border-amber-600/20 font-medium"
                            >
                                Low Stock
                            </Badge>
                        )}
                    </div>
                    {/* Details Row */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap pl-11">
                        <Badge variant="outline">
                            {item.categories?.name ?? "Uncategorized"}
                        </Badge>
                        <Separator
                            orientation="vertical"
                            className="h-4 mx-1"
                        />
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span>Unit: {item.unit}</span>
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
                    {/* Existing Edit Sheet Trigger with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                "shadow-soft-sm hover:shadow-soft-md active:shadow-soft-inner",
                                                "border border-black/10 dark:border-white/15",
                                                "hover:bg-accent/50 active:bg-accent/70",
                                                "hover:scale-[1.02] active:scale-[0.98]",
                                                "transition-all duration-150 ease-in-out",
                                                "group"
                                            )}
                                        >
                                            <PencilIcon className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />{" "}
                                            Edit
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        className={cn(
                                            "sm:max-w-xl w-[90vw] overflow-y-auto p-0",
                                            "border-l border-border",
                                            "bg-gradient-to-b from-card to-card/95 dark:from-card dark:to-card/90",
                                            "shadow-soft-lg"
                                        )}
                                    >
                                        <SheetHeader className="p-6 pb-4 border-b border-border/80">
                                            <SheetTitle>
                                                Edit: {item.item_name}
                                            </SheetTitle>
                                            <SheetDescription>
                                                Update item details. Unit and
                                                stock quantity cannot be changed
                                                here. Use stock adjustments for
                                                quantity changes.
                                            </SheetDescription>
                                        </SheetHeader>
                                        <Separator />
                                        <div className="p-6">
                                            <EditSheetWrapper itemId={itemId} />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit item details</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* DropdownMenu with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "rounded-full hover:bg-accent/50 active:scale-95 transition-all duration-150 ease-in-out",
                                                "active:bg-accent/70"
                                            )}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className={cn(
                                            "border border-black/5 dark:border-white/10",
                                            "bg-gradient-to-b from-popover to-popover/95 dark:from-popover dark:to-popover/90",
                                            "shadow-soft-md"
                                        )}
                                    >
                                        <DropdownMenuItem disabled>
                                            View History
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={onDeleteClick}
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        >
                                            Delete Item
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>More actions</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <Separator className="mt-4 mb-6" />
        </div>
    );
}
