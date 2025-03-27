import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

// GET handler for fetching all categories
export async function GET() {
    noStore(); // Prevent caching
    try {
        // Create a Supabase client with the async pattern
        const supabase = await createRouteHandlerSupabaseClient();

        // Query categories
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error fetching categories:", error);
            return NextResponse.json(
                { message: "Failed to fetch categories", error: error.message },
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
