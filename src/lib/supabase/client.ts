// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase"; // Ensure this path is correct

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Optional: Keep console log for development verification
if (process.env.NODE_ENV === "development") {
    console.log("Supabase Client Configuration (Client-side):", {
        url: supabaseUrl,
        hasKey: !!supabaseAnonKey,
    });
}

if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Use a function to ensure env vars are read client-side if needed,
// but memoization is good for performance.
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
    null;

export const createClient = () => {
    // Memoization: Create client only once
    if (supabaseClient) {
        return supabaseClient;
    }

    supabaseClient = createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey
    );

    // Optional: Add auth state change listener for debugging if needed here,
    // but it's also handled in AuthContext.
    // supabaseClient.auth.onAuthStateChange((event, session) => {
    //     if (process.env.NODE_ENV === "development") {
    //         console.log("Client Supabase Auth State Change:", { event, session: !!session });
    //     }
    // });

    return supabaseClient;
};
