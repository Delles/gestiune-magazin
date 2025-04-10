// src/app/(authenticated)/settings/categories/_components/categories-list.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Removed direct client import: import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import {
    MoreHorizontal,
    PlusCircle,
    Trash2, // Keep imported for commented code
    AlertTriangle, // Keep imported for commented code
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter, // Keep imported for commented code
    DialogClose, // Keep imported for commented code
    DialogDescription, // Keep imported for commented code
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator, // Keep imported for commented code
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryForm } from "./category-form";
import type { CategoryFormValues } from "@/lib/validation/settings-schemas";
import { useAuth } from "@/contexts/auth-context";
// Import API helper functions using absolute path
import {
    getCategories,
    createCategory,
} from "@/app/(authenticated)/settings/_data/api";
// TODO: Import updateCategory, deleteCategory when implemented

type Category = Database["public"]["Tables"]["categories"]["Row"];

// --- Removed local data fetching/mutation functions ---

// --- Component ---
export function CategoriesList() {
    const queryClient = useQueryClient();
    // Removed: const supabase = createClient();
    const { session, isLoading: isAuthLoading } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    // Keep delete state commented out but syntactically valid
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
        null
    );
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const {
        data: categories,
        isLoading: isLoadingCategories,
        error,
        isFetching,
    } = useQuery<Category[], Error>({
        queryKey: ["categories"],
        queryFn: getCategories,
        enabled: !!session && !isAuthLoading,
    });

    const createMutation = useMutation<Category, Error, CategoryFormValues>({
        mutationFn: createCategory,
        onSuccess: (data) => {
            if (!isMountedRef.current) return;
            toast.success(`Category "${data.name}" created successfully!`);
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsFormOpen(false);
            setEditingCategory(null);
        },
        onError: (error) => {
            if (!isMountedRef.current) return;
            toast.error(error.message || "Failed to create category.");
        },
    });

    // Keep delete mutation commented out but syntactically valid
    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: async (id: string) => {
            throw new Error("Delete not implemented");
            // TODO: Replace with actual deleteCategory API call
            // await deleteCategory(id);
        },
        onSuccess: () => {
            if (!isMountedRef.current) return;
            toast.success("Category deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
        },
        onError: (error) => {
            if (!isMountedRef.current) return;
            toast.error(error.message || "Failed to delete category.");
        },
    });

    // Keep edit handler commented out but syntactically valid
    const handleOpenEditDialog = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    // Keep delete handler commented out but syntactically valid
    const handleOpenDeleteDialog = (category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    // Keep delete confirmation handler commented out but syntactically valid
    const handleConfirmDelete = () => {
        if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
        }
    };

    const handleFormDialogChange = (open: boolean) => {
        if (!isMountedRef.current) return;
        setIsFormOpen(open);
        if (!open) {
            setEditingCategory(null);
        }
    };

    // Keep delete dialog change handler commented out but syntactically valid
    const handleDeleteDialogChange = (open: boolean) => {
        if (!isMountedRef.current) return;
        setIsDeleteDialogOpen(open);
        if (!open) {
            setCategoryToDelete(null);
        }
    };

    const handleFormSubmit = async (values: CategoryFormValues) => {
        // if (editingCategory) {
        //     // TODO: Call update mutation
        //     toast.info("Update not implemented yet.")
        // } else {
        await createMutation.mutateAsync(values); // Use mutateAsync for async handling if needed
        // }
    };

    if (isAuthLoading) {
        return <div>Loading authentication...</div>; // Or a better loading state
    }

    if (!session) {
        return <div>Please log in to view categories.</div>; // Or redirect
    }

    if (isLoadingCategories) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600">
                Error loading categories: {(error as Error).message}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Categories</h2>
                <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            onClick={() => setEditingCategory(null)} // Ensure reset when opening for create
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New
                            Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {/* {editingCategory ? "Edit" : "Add New"} Category */}
                                Add New Category{" "}
                                {/* Simplified title until edit is back */}
                            </DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                            onSubmit={handleFormSubmit}
                            // Pass the category to edit, or null for new
                            initialData={null} // Pass null until edit is back
                            // Disable form based on mutation status
                            isPending={createMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {isFetching && !isLoadingCategories && (
                <div className="text-sm text-muted-foreground">Updating...</div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories && categories.length > 0 ? (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>
                                    <TableCell>
                                        {category.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    aria-haspopup="true"
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Toggle menu
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    Actions
                                                </DropdownMenuLabel>
                                                {/* Keep edit/delete commented but valid */}
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleOpenEditDialog(
                                                            category
                                                        )
                                                    }
                                                    disabled // Disable until implemented
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                    onClick={() =>
                                                        handleOpenDeleteDialog(
                                                            category
                                                        )
                                                    }
                                                    disabled // Disable until implemented
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="h-24 text-center"
                                >
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Keep Delete Confirmation Dialog commented but valid */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={handleDeleteDialogChange}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription className="flex items-center">
                            <AlertTriangle className="text-red-500 mr-2 h-5 w-5" />
                            Are you sure you want to delete the category &quot;
                            {categoryToDelete?.name}&quot;? This action cannot
                            be undone.
                            {/* Future: Add check for linked items here */}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
