"use client";

import InventoryItemFormClient from "../_components/inventory-item-form-client";
import { useRouter } from "next/navigation";

export default function EditFormContainer({ itemId }: { itemId: string }) {
    const router = useRouter();

    const handleSuccess = () => {
        router.refresh(); // Refresh the page to show updated data
    };

    return (
        <InventoryItemFormClient itemId={itemId} onSuccess={handleSuccess} />
    );
}
