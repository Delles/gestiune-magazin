// src/lib/supabase/server.ts
import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase"; // Ensure this path is correct
import { type CookieOptions } from "@supabase/ssr";

// This function is designed to be called *within* Server Components,
// Server Actions, or Route Handlers where `cookies()` is available.
export const createServerClient = async () => {
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
                    } catch {
                        // The setAll method was called from a Server Component
                        // This can be ignored if you have middleware refreshing
                        // user sessions
                    }
                },
            },
        }
    );
};
