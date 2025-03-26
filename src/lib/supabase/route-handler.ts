// src/lib/supabase/route-handler.ts
import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase"; // Ensure this path is correct
import { type CookieOptions } from "@supabase/ssr";

// This function is designed to be called *within* Next.js Route Handlers
// (e.g., app/api/some-route/route.ts) where `cookies()` is available.
export const createRouteHandlerSupabaseClient = async () => {
    // In Next.js 15, cookies() returns a Promise
    const cookieStore = await cookies();

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options?: CookieOptions;
                    }[]
                ) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch (error) {
                        console.error(
                            "Error setting cookies in route handler",
                            error
                        );
                    }
                },
            },
        }
    );
};
