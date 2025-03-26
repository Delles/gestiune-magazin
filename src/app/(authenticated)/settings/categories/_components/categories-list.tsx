// src/app/(authenticated)/settings/categories/_components/categories-list.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // RULE 12, 35
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"; // RULE 12
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // RULE 12
import { CategoryForm } from "./category-form"; // Import the form
import type { CategoryFormValues } from "@/lib/validation/settings-schemas";

type Category = Database["public"]["Tables"]["categories"]["Row"];

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
            // PostgreSQL unique violation code
            throw new Error(`Category "${values.name}" already exists.`);
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
                `Category name "${values.name}" is already in use.`
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

export function CategoriesList() {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );

    const {
        data: categories,
        isLoading,
        error,
    } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: () => fetchCategories(supabase),
    });

    const mutation = useMutation({
        mutationFn: async (values: CategoryFormValues) => {
            if (values.id) {
                await updateCategory(supabase, values);
            } else {
                await createCategory(supabase, values);
            }
        },
        onSuccess: (_, variables) => {
            toast.success(
                `Category "${variables.name}" ${
                    variables.id ? "updated" : "created"
                } successfully!`
            );
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsFormOpen(false); // Close dialog on success
            setEditingCategory(null);
        },
        onError: (error) => {
            toast.error(error.message || "An error occurred.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCategory(supabase, id),
        onSuccess: () => {
            toast.success("Category deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete category.");
        },
    });

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleDelete = (category: Category) => {
        if (
            window.confirm(
                `Are you sure you want to delete the category "${category.name}"?`
            )
        ) {
            deleteMutation.mutate(category.id);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setEditingCategory(null); // Reset editing state when dialog closes
        }
        setIsFormOpen(open);
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <p className="text-destructive">
                Error loading categories: {error.message}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setIsFormOpen(true)}>
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
                        onSubmit={mutation.mutateAsync} // Pass the async mutation function
                        isPending={mutation.isPending}
                    />
                    {/* DialogFooter and DialogClose can be removed if submission closes it */}
                </DialogContent>
            </Dialog>

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
                                                        handleEdit(category)
                                                    }
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        handleDelete(category)
                                                    }
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                >
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
        </div>
    );
}
