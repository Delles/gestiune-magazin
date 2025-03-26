// src/app/(authenticated)/settings/categories/page.tsx
import { CategoriesList } from "./_components/categories-list"; // Import the list component
import { Separator } from "@/components/ui/separator";

export default function CategoriesSettingsPage() {
    // Rename function for clarity
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Inventory Categories</h3>
                <p className="text-sm text-muted-foreground">
                    Manage product categories used for organizing inventory
                    items.
                </p>
            </div>
            <Separator />
            <CategoriesList /> {/* Render the categories list component */}
        </div>
    );
}
