// src/components/layout/header.tsx
"use client"; // RULE 21: Needs client-side hooks/interaction

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; // Use your existing auth context
import { createClient } from "@/lib/supabase/client"; // Use your existing client
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Use existing toaster for feedback
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Function to fetch store settings
async function fetchStoreName(
    supabase: ReturnType<typeof createClient>
): Promise<string | null> {
    const { data, error } = await supabase
        .from("StoreSettings")
        .select("store_name")
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching store name:", error);
        return null;
    }

    return data?.store_name || null;
}

export function Header() {
    const { session, isLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient(); // Memoized client from your setup
    const [storeName, setStoreName] = useState<string>("My Store"); // Default value

    // Only fetch store name if authenticated
    const { data: fetchedStoreName } = useQuery({
        queryKey: ["storeName"],
        queryFn: () => fetchStoreName(supabase),
        enabled: !!session, // Only run query if user is authenticated
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Update store name when data is fetched
    useEffect(() => {
        if (session && fetchedStoreName) {
            setStoreName(fetchedStoreName);
        } else if (!session) {
            setStoreName("My Store");
        }
    }, [session, fetchedStoreName]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Logout failed: " + error.message);
            console.error("Logout error:", error);
        } else {
            // AuthProvider handles toast and redirect via onAuthStateChange
            // router.push('/login'); // Can be redundant if AuthProvider handles it
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Header container with green rectangle margins */}
            <div className="h-14 w-full max-w-[1500px] mx-auto px-2 sm:px-3 lg:px-4">
                {/* Inner flex container to position elements */}
                <div className="flex w-full h-full items-center justify-between">
                    {/* Left - Logo (blue rectangle position) */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center py-2">
                            <span className="font-bold">{storeName}</span>
                        </Link>
                    </div>

                    {/* Center - Navigation */}
                    <div className="flex-1 flex justify-center">
                        {session && (
                            <nav className="flex items-center space-x-6 text-sm font-medium">
                                <Link
                                    href="/dashboard"
                                    className="transition-colors hover:text-foreground/80 text-foreground/60 py-2"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/inventory"
                                    className="transition-colors hover:text-foreground/80 text-foreground/60 py-2"
                                >
                                    Inventory
                                </Link>
                                <Link
                                    href="/settings"
                                    className="transition-colors hover:text-foreground/80 text-foreground/60 py-2"
                                >
                                    Settings
                                </Link>
                            </nav>
                        )}
                    </div>

                    {/* Right - Auth Button (blue rectangle position) */}
                    <div className="flex items-center">
                        {isLoading ? (
                            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
                        ) : session ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="py-2"
                            >
                                Logout
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/login")}
                                className="py-2"
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
