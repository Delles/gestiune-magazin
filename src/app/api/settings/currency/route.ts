import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";
import { currencySchema } from "@/lib/validation/settings-schemas";

// GET handler for fetching currency settings
export async function GET() {
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

        // Assume a single row for currency settings, potentially scoped by RLS
        const { data, error } = await supabase
            .from("CurrencySettings") // Ensure table name matches Supabase
            .select("*")
            .maybeSingle(); // Fetch the single row or null

        if (error) {
            console.error("Error fetching currency settings:", error);
            return NextResponse.json(
                {
                    message: "Failed to fetch currency settings",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (!data) {
            // Return an empty object or specific structure if no settings are found
            return NextResponse.json({});
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Unexpected error fetching currency settings:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// POST handler for creating/updating currency settings (Upsert logic)
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
        const validation = currencySchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Invalid request data",
                    errors: validation.error.format(),
                },
                { status: 400 }
            );
        }

        // Map validated data to DB columns
        const settingsDataToUpsert = {
            currency_code: validation.data.currencyCode,
            // Add user_id if required by table/RLS
            // user_id: user.id,
        };

        // Upsert the currency settings
        const { data, error } = await supabase
            .from("CurrencySettings")
            .upsert(settingsDataToUpsert, {
                // onConflict: 'user_id', // Specify if needed
                // ignoreDuplicates: false,
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving currency settings:", error);
            return NextResponse.json(
                {
                    message: "Failed to save currency settings",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 200 }); // 200 OK
    } catch (error) {
        console.error("Unexpected error saving currency settings:", error);
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
