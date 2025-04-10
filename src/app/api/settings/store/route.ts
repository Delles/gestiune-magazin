import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";
import { storeInfoSchema } from "@/lib/validation/settings-schemas";

// Define the fixed ID for the single store settings row
const STORE_SETTINGS_ID = 1;

// GET handler for fetching store settings
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

        // Assume there's only one row, or filter by user_id if applicable via RLS
        const { data, error } = await supabase
            .from("StoreSettings") // Ensure table name matches Supabase
            .select("*")
            .maybeSingle(); // Fetch the single row or null

        if (error) {
            console.error("Error fetching store settings:", error);
            return NextResponse.json(
                {
                    message: "Failed to fetch store settings",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        if (!data) {
            // Return an empty object or specific structure if no settings are found
            // Allows the form to initialize correctly
            return NextResponse.json({});
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Unexpected error fetching store settings:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// POST handler for creating/updating store settings (Upsert logic)
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
        const validation = storeInfoSchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Invalid request data",
                    errors: validation.error.format(),
                },
                { status: 400 }
            );
        }

        // Map Zod schema output to DB columns, including the fixed ID
        const settingsDataToUpsert = {
            id: STORE_SETTINGS_ID, // Include the fixed ID
            store_name: validation.data.storeName,
            store_address: validation.data.storeAddress ?? null,
            store_phone: validation.data.storePhone ?? null,
            store_email: validation.data.storeEmail ?? null,
            // user_id: user.id // Include user_id if necessary for the upsert
        };

        // Upsert the store settings, targeting the conflict on 'id'.
        const { data, error } = await supabase
            .from("StoreSettings")
            .upsert(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                settingsDataToUpsert as any, // Use type assertion to bypass strict type check for upsert with fixed ID
                {
                    onConflict: "id", // Specify the primary key column for conflict resolution
                    // ignoreDuplicates: false, // Default is false, ensures update
                }
            )
            .select()
            .single(); // Return the upserted row

        if (error) {
            console.error("Error saving store settings:", error);
            return NextResponse.json(
                {
                    message: "Failed to save store settings",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 200 }); // 200 OK for update/create
    } catch (error) {
        console.error("Unexpected error saving store settings:", error);
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
