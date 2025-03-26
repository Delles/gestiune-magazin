// src/app/(authenticated)/dashboard/page.tsx
import { createServerClient } from "@/lib/supabase/server"; // Use the server helper
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache"; // Keep noStore

export default async function Dashboard() {
    noStore(); // Keep dynamic rendering

    // Get the supabase client (await since it's now async)
    const supabase = await createServerClient();

    // Use getUser() for server-side verification
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    // Log error if getUser fails
    if (userError) {
        console.error("Dashboard: Error fetching user:", userError.message);
        // Redirecting on error might be too aggressive, consider showing an error message instead
        // For now, let's redirect as before
        redirect("/login?error=session_error&redirect_to=/dashboard");
    }

    // If no user is found (not authenticated), redirect to login
    if (!user) {
        console.log("Dashboard: No user found, redirecting to login.");
        redirect("/login?redirect_to=/dashboard");
    }

    // Render the page if user is found
    return (
        <div>
            <h1>Welcome to the Dashboard!</h1>
            <p>You are logged in as: {user.email}</p>
            {/* Acknowledge potential server log error for this page */}
            <p className="text-xs text-muted-foreground mt-4">
                (Note: Server logs might show a benign cookie error for this
                page in some environments)
            </p>
        </div>
    );
}
