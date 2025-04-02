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
import { ArrowLeftIcon, Package, PencilIcon } from "lucide-react";
import EditSheetWrapper from "./edit-sheet-wrapper"; // Assuming it's in the same directory
import { Tables } from "@/types/supabase"; // Assuming you have generated types
import { getCategoryIcon } from "@/lib/category-icons"; // Import the new utility

// Define the props for the header component
// It's better to be more specific than using the raw Tables type if possible,
// especially regarding the nested 'categories' object structure.
// Let's refine the type based on the Supabase query in page.tsx
type ItemWithCategory = Pick<
    Tables<"InventoryItems">,
    "id" | "item_name" | "unit" // Add other fields from InventoryItems used here if any
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

    return (
        <>
            {/* Back Navigation */}
            <div className="flex items-center space-x-2 mb-4">
                {" "}
                {/* Added margin-bottom */}
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
                        {/* Render the dynamic category icon */}
                        <CategoryIcon
                            className="h-6 w-6 text-muted-foreground"
                            aria-label={`${
                                item.categories?.name ?? "Item"
                            } category icon`}
                        />
                        {item.item_name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <Badge variant="outline">
                            {item.categories?.name ?? "Uncategorized"}{" "}
                            {/* Use nullish coalescing */}
                        </Badge>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Unit: {item.unit}</span>
                    </div>
                </div>

                {/* Edit Item Sheet */}
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
                                cannot be changed here. Use stock adjustments
                                for quantity changes.
                            </SheetDescription>
                        </SheetHeader>
                        <Separator />
                        <div className="p-6">
                            {/* EditSheetWrapper handles its own open state */}
                            <EditSheetWrapper itemId={itemId} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
