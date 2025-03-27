import { Metadata } from "next";
import InventoryList from "./_components/inventory-list";

export const metadata: Metadata = {
    title: "Inventory Management",
    description: "Manage your inventory items",
};

export default function InventoryPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Inventory Management
                </h1>
            </div>
            <InventoryList />
        </div>
    );
}
