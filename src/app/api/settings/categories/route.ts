import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";
import { categorySchema } from "@/lib/validation/settings-schemas";

// GET handler for fetching all categories
export async function GET() {
    noStore(); // Prevent caching

    try {
        const supabase = await createRouteHandlerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Query categories, ensuring RLS can apply if needed based on user or assuming admin access controlled elsewhere
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error fetching categories:", error);
            return NextResponse.json(
                {
                    message: "Failed to fetch categories",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Unexpected error fetching categories:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// POST handler for creating a new category
export async function POST(request: Request) {
    noStore();

    try {
        const supabase = await createRouteHandlerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const json = await request.json();
        const validation = categorySchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Invalid request data",
                    errors: validation.error.format(),
                },
                { status: 400 }
            );
        }

        const { name, description } = validation.data;

        // Check for duplicate category name (case-insensitive)
        const { data: existingCategory, error: checkError } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", name) // Case-insensitive comparison
            .maybeSingle();

        if (checkError) {
            console.error("Error checking for existing category:", checkError);
            return NextResponse.json(
                {
                    message: "Failed to check for existing category",
                    error: checkError.message,
                },
                { status: 500 }
            );
        }

        if (existingCategory) {
            return NextResponse.json(
                { message: `Category with name "${name}" already exists.` },
                { status: 409 } // Conflict
            );
        }

        // Insert the new category
        const { data: newCategory, error: insertError } = await supabase
            .from("categories")
            .insert({
                name: name,
                description: description ?? null,
                // 'user_id': user.id, // Include if RLS requires user_id association
            })
            .select()
            .single(); // Return the inserted row

        if (insertError) {
            console.error("Error creating category:", insertError);
            // Handle potential DB constraints, e.g., unique name constraint if handled by DB
            if (insertError.code === "23505") {
                // Unique violation
                return NextResponse.json(
                    { message: "Category name must be unique." },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                {
                    message: "Failed to create category",
                    error: insertError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(newCategory, { status: 201 }); // 201 Created
    } catch (error) {
        console.error("Unexpected error creating category:", error);
        // Check if the error is a ZodError from parsing if not handled above (though safeParse should prevent this)
        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message || "An unexpected error occurred" },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
