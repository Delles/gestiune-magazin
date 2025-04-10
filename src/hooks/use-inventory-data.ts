import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";
import {
    getInventoryItems,
    getCategories,
    deleteInventoryItems,
    updateItemReorderPoint,
} from "@/app/(authenticated)/inventory/_data/api";

// Define the extended type for inventory items including the category name
type InventoryItemWithCategoryName = Tables<"InventoryItems"> & {
    category_name: string | null; // Assuming API provides this
};

export function useInventoryData() {
    const queryClient = useQueryClient();
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const {
        data: inventoryItems = [],
        isLoading: isLoadingItems,
        error: itemsError,
    } = useQuery<InventoryItemWithCategoryName[], Error>({
        queryKey: ["inventoryItems"],
        queryFn: getInventoryItems,
    });

    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        error: categoriesError,
    } = useQuery<Tables<"categories">[], Error>({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteInventoryItems,
        onSuccess: (data, variables) => {
            if (!isMountedRef.current) return;
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            // Resetting selection should be handled by the component using the mutation
            toast.success(`${variables.length} item(s) deleted successfully.`);
            // Allow component to handle dialog closing etc.
            return { success: true, count: variables.length };
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete items: ${error.message}`);
            // Allow component to handle dialog closing
            return { success: false };
        },
    });

    const updateReorderPointMutation = useMutation({
        mutationFn: (variables: { id: string; reorder_point: number | null }) =>
            updateItemReorderPoint(variables.id, variables.reorder_point),
        onSuccess: (_, variables) => {
            if (!isMountedRef.current) return;
            queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
            queryClient.invalidateQueries({
                queryKey: ["inventoryItem", variables.id],
            });
            toast.success("Reorder point updated successfully.");
            // Allow component to handle popover/dialog closing
            return { success: true };
        },
        onError: (error: Error) => {
            toast.error(`Failed to update reorder point: ${error.message}`);
            return { success: false };
        },
    });

    const isLoading = isLoadingItems || isLoadingCategories;
    const queryError = itemsError || categoriesError;

    return {
        inventoryItems,
        categories,
        isLoading,
        queryError,
        deleteMutation,
        updateReorderPointMutation,
    };
}
