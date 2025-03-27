"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Minus } from "lucide-react";

interface SubmitButtonProps {
    isSubmitting: boolean;
    stockActionType: "increase" | "decrease";
}

export function SubmitButton({
    isSubmitting,
    stockActionType,
}: SubmitButtonProps) {
    return (
        <Button
            type="submit"
            className={`w-full mt-3 h-9 text-sm font-medium group relative overflow-hidden ${
                isSubmitting ? "opacity-90" : ""
            }`}
            disabled={isSubmitting}
        >
            <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
            <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    <>
                        {stockActionType === "increase" ? (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                Add to Inventory
                            </>
                        ) : (
                            <>
                                <Minus className="h-3.5 w-3.5" />
                                Remove from Inventory
                            </>
                        )}
                    </>
                )}
            </span>
        </Button>
    );
}
