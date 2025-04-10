import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server"; // Corrected import name

export const dynamic = "force-dynamic"; // Ensure fresh data

/**
 * GET /api/categories/
 * Fetches all categories.
 */
export async function GET() {
    const supabase = await createServerClient();

    try {
        const { data: categories, error } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching categories:", error);
            return NextResponse.json(
                {
                    message: "Error fetching categories",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(categories);
    } catch (err) {
        console.error("Unexpected error in GET /api/categories:", err);
        return NextResponse.json(
            {
                message: "An unexpected error occurred",
                error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
        );
    }
}
