// src/lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase"; // Ensure this path is correct

// This function is designed to be called *within* Server Components,
// Server Actions, or Route Handlers where `cookies()` is available.
export const createServerClient = () => {
    const cookieStore = cookies(); // Gets the cookies from the incoming request
    return createServerComponentClient<Database>({
        cookies: () => cookieStore, // Pass cookie store factory
    });
};
