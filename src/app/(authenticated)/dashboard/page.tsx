// src/app/dashboard/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const supabase = createServerComponentClient({ cookies });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login"); // Redirect to login if not authenticated
    }

    return (
        <div>
            <h1>Welcome to the Dashboard!</h1>
            <p>You are logged in.</p>
            {/* Your dashboard content here */}
        </div>
    );
}
