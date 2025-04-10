// src/app/(authenticated)/settings/categories/_components/categories-list.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import {
    MoreHorizontal,
    PlusCircle,
    Trash2,
    AlertTriangle,
} from "lucide-react"; // Add icons

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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter, // Import DialogFooter
    DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator, // Add Separator
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryForm } from "./category-form";
import type { CategoryFormValues } from "@/lib/validation/settings-schemas";
import { useAuth } from "@/contexts/auth-context"; // <--- IMPORT useAuth

type Category = Database["public"]["Tables"]["categories"]["Row"];

// --- Data Fetching & Mutations (Keep as before) ---
// ... fetchCategories, createCategory, updateCategory, deleteCategory ...
// --- Data Fetching ---
async function fetchCategories(supabase: ReturnType<typeof createClient>) {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Could not load categories.");
    }
    return data;
}

// --- Data Mutations ---
async function createCategory(
    supabase: ReturnType<typeof createClient>,
    values: CategoryFormValues
) {
    const { error } = await supabase.from("categories").insert({
        name: values.name,
        description: values.description || null,
    });
    if (error) {
        console.error("Create category error:", error);
        // Check for unique constraint violation
        if (error.code === "23505") {
            throw new Error(
                `A category named "${values.name}" already exists. Please use a unique name.`
            );
        }
        throw new Error("Failed to create category.");
    }
}

async function updateCategory(
    supabase: ReturnType<typeof createClient>,
    values: CategoryFormValues
) {
    if (!values.id) throw new Error("Category ID is missing for update.");
    const { error } = await supabase
        .from("categories")
        .update({
            name: values.name,
            description: values.description || null,
        })
        .eq("id", values.id);
    if (error) {
        console.error("Update category error:", error);
        if (error.code === "23505") {
            throw new Error(
                `The name "${values.name}" is already used by another category. Please choose a unique name.`
            );
        }
        throw new Error("Failed to update category.");
    }
}

async function deleteCategory(
    supabase: ReturnType<typeof createClient>,
    id: string
) {
    // Add dependency check later (Phase 2) before deleting
    // For Phase 1, direct delete is okay as no items link yet.
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
        console.error("Delete category error:", error);
        // Handle foreign key constraints if they exist later
        // if (error.code === '23503') { // Foreign key violation
        //     throw new Error("Cannot delete category. It is linked to inventory items.");
        // }
        throw new Error("Failed to delete category.");
    }
}

// --- Component ---
export function CategoriesList() {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const { session, isLoading: isAuthLoading } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
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
        isLoading: isLoadingCategories, // Renamed to avoid conflict
        error,
        isFetching, // Use isFetching for subsequent loads
    } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: () => fetchCategories(supabase),
        enabled: !!session && !isAuthLoading, // Only run query if logged in and auth check finished
    });

    const createUpdateMutation = useMutation({
        // Renamed for clarity
        mutationFn: async (values: CategoryFormValues) => {
            if (values.id) {
                await updateCategory(supabase, values);
            } else {
                await createCategory(supabase, values);
            }
        },
        onSuccess: (_, variables) => {
            if (!isMountedRef.current) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "Component unmounted before create/update onSuccess."
                    );
                }
                return;
            }
            toast.success(
                `Category "${variables.name}" ${
                    variables.id ? "updated" : "created"
                } successfully!`
            );
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsFormOpen(false);
            setEditingCategory(null);
        },
        onError: (error) => {
            if (
                !isMountedRef.current &&
                process.env.NODE_ENV === "development"
            ) {
                console.log(
                    "Component unmounted before create/update onError (toast only)."
                );
            }
            toast.error(error.message || "An error occurred.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCategory(supabase, id),
        onSuccess: () => {
            if (!isMountedRef.current) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Component unmounted before delete onSuccess.");
                }
                return;
            }
            toast.success("Category deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
        },
        onError: (error) => {
            if (
                !isMountedRef.current &&
                process.env.NODE_ENV === "development"
            ) {
                console.log(
                    "Component unmounted before delete onError (toast only)."
                );
            }
            toast.error(error.message || "Failed to delete category.");
        },
    });

    const handleOpenEditDialog = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleOpenDeleteDialog = (category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
        }
    };

    const handleFormDialogChange = (open: boolean) => {
        if (!isMountedRef.current) {
            if (process.env.NODE_ENV === "development") {
                console.log(
                    "Component unmounted before handleFormDialogChange."
                );
            }
            return;
        }
        if (!open) {
            setEditingCategory(null);
        }
        setIsFormOpen(open);
    };

    const handleDeleteDialogChange = (open: boolean) => {
        if (!isMountedRef.current) {
            if (process.env.NODE_ENV === "development") {
                console.log(
                    "Component unmounted before handleDeleteDialogChange."
                );
            }
            return;
        }
        if (!open) {
            setCategoryToDelete(null);
        }
        setIsDeleteDialogOpen(open);
    };

    // --- ADJUST LOADING STATE ---
    // Show loading skeleton if either auth is loading or categories are loading/fetching
    const showLoadingSkeleton = isAuthLoading || isLoadingCategories;
    // --- END ADJUST LOADING STATE ---

    if (showLoadingSkeleton) {
        // Use combined loading state
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    // Handle case where user is logged out (query is disabled) or fetch error
    if ((!session && !isAuthLoading) || error) {
        return (
            <div className="text-center text-muted-foreground py-10">
                {error
                    ? `Error loading categories: ${error.message}`
                    : "Please log in to view categories."}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add/Edit Category Dialog */}
            <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        onClick={() => setIsFormOpen(true)}
                        disabled={!session}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory
                                ? "Edit Category"
                                : "Add New Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? "Update the details for this category."
                                : "Enter the details for the new category."}
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                        initialData={editingCategory}
                        onSubmit={createUpdateMutation.mutateAsync}
                        isPending={createUpdateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Categories Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories && categories.length > 0 ? (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-xs">
                                        {category.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
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
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        handleOpenEditDialog(
                                                            category
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        handleOpenDeleteDialog(
                                                            category
                                                        )
                                                    }
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />{" "}
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
                                    {isFetching
                                        ? "Loading..."
                                        : "No categories found."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={handleDeleteDialogChange}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />{" "}
                            Are you absolutely sure?
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete the category{" "}
                            <span className="font-semibold">
                                {categoryToDelete?.name}
                            </span>
                            .{/* Add warning about linked items later */}
                            {/* <br/> Any inventory items linked to this category will need to be updated. */}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
