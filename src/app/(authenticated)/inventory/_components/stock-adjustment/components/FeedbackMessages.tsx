// src/app/(authenticated)/inventory/_components/stock-adjustment/components/FeedbackMessages.tsx
import React from "react";
import { AlertTriangle, Check } from "lucide-react";

interface FeedbackMessagesProps {
    serverError: string | null;
    showSuccess: boolean;
    successMessage?: string;
}

export function FeedbackMessages({
    serverError,
    showSuccess,
    successMessage = "Stock adjustment successfully recorded!",
}: FeedbackMessagesProps) {
    return (
        <>
            {serverError && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium border border-destructive/30 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {serverError}
                </div>
            )}

            {showSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md text-sm font-medium border border-green-200 dark:border-green-700 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {successMessage}
                </div>
            )}
        </>
    );
}
