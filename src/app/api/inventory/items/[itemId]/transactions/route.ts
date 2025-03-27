import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { unstable_noStore as noStore } from "next/cache";

interface RouteParams {
    params: {
        itemId: string;
    };
}

// GET handler for retrieving stock transactions for an item
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    noStore();
    try {
        // Wait for params to ensure they're available
        const { itemId } = await params;

        // Create Supabase client
        const supabase = await createRouteHandlerSupabaseClient();

        // Check if user is authenticated
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get stock transactions for the item
        const { data: transactions, error } = await supabase
            .from("StockTransactions")
            .select(
                `
                *
            `
            )
            .eq("item_id", itemId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching stock transactions:", error);
            return NextResponse.json(
                { message: "Failed to fetch stock transactions" },
                { status: 500 }
            );
        }

        // Get profiles separately to avoid join issues
        const userIds = transactions
            .map((t) => t.user_id)
            .filter((id) => id !== null) as string[];

        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in(
                "id",
                userIds.length > 0
                    ? userIds
                    : ["00000000-0000-0000-0000-000000000000"]
            );

        // Create a map of user IDs to names
        const userMap = new Map<string, string>();
        if (profiles) {
            profiles.forEach((profile) => {
                userMap.set(profile.id, profile.full_name || "Unknown User");
            });
        }

        // Format the data to include user names
        const formattedTransactions = transactions.map((transaction) => ({
            ...transaction,
            user_name: transaction.user_id
                ? userMap.get(transaction.user_id) || "Unknown User"
                : null,
        }));

        return NextResponse.json(formattedTransactions);
    } catch (error) {
        console.error("Error fetching stock transactions:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching stock transactions" },
            { status: 500 }
        );
    }
}
