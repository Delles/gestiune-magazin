"use client";

import StockAdjustmentForm from "./stock-adjustment/index";

// Interface for form props
interface StockAdjustmentWrapperProps {
    itemId: string;
    itemName: string;
    unit: string;
    currentStock: number;
    onSuccess?: () => void;
    initialType?: "increase" | "decrease";
}

// Export the new refactored component
export default function StockAdjustmentWrapper(
    props: StockAdjustmentWrapperProps
) {
    return <StockAdjustmentForm {...props} />;
}
