"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the InventoryItemForm component
const InventoryItemForm = dynamic(() => import("./inventory-item-form"), {
    loading: () => (
        <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading form...</span>
        </div>
    ),
    ssr: false,
});

interface InventoryItemFormClientProps {
    itemId?: string;
    onSuccess?: () => void;
}

export default function InventoryItemFormClient({
    itemId,
    onSuccess,
}: InventoryItemFormClientProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // This ensures the component only renders on the client
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading form...</span>
            </div>
        );
    }

    return <InventoryItemForm itemId={itemId} onSuccess={onSuccess} />;
}
