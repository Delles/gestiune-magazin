// src/lib/supabase/route-handler.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase"; // Ensure this path is correct

// This function is designed to be called *within* Next.js Route Handlers
// (e.g., app/api/some-route/route.ts) where `cookies()` is available.
export const createRouteHandlerSupabaseClient = () => {
    const cookieStore = cookies(); // Gets the cookies from the incoming request
    return createRouteHandlerClient<Database>({
        cookies: () => cookieStore, // Pass cookie store factory
    });
};
