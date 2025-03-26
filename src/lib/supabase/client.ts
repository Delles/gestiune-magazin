import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase Configuration:", {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
});

if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

let supabaseClient: ReturnType<
    typeof createClientComponentClient<Database>
> | null = null;

export const createClient = () => {
    if (supabaseClient) return supabaseClient;

    try {
        supabaseClient = createClientComponentClient<Database>({
            supabaseUrl,
            supabaseKey: supabaseAnonKey,
        });

        // Test the client connection
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (process.env.NODE_ENV === "development") {
                console.log("Auth State Change:", {
                    event,
                    session: !!session,
                });
            }
        });

        return supabaseClient;
    } catch (error) {
        console.error("Error creating Supabase client:", error);
        throw error;
    }
};
