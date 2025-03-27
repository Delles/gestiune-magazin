// src/components/layout/header.tsx
"use client"; // RULE 21: Needs client-side hooks/interaction

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; // Use your existing auth context
import { createClient } from "@/lib/supabase/client"; // Use your existing client
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Use existing toaster for feedback

export function Header() {
    const { session, isLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient(); // Memoized client from your setup

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
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        {/* Add Logo/Icon here if you have one */}
                        <span className="hidden font-bold sm:inline-block">
                            Gestiune Magazin
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {session && ( // Only show main nav if logged in
                            <>
                                <Link
                                    href="/dashboard"
                                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/inventory"
                                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                                >
                                    Inventory
                                </Link>
                                {/* Add Sales Link later */}
                                {/* Add Suppliers Link later */}
                                <Link
                                    href="/settings" // Link to settings root
                                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                                >
                                    Settings
                                </Link>
                                {/* Add Reports Link later */}
                            </>
                        )}
                    </nav>
                </div>
                {/* Add Mobile Menu Button Here Later */}
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {isLoading ? (
                        <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
                    ) : session ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/login")}
                        >
                            Login
                        </Button>
                    )}
                    {/* Add Theme Toggle Button Here Later */}
                </div>
            </div>
        </header>
    );
}
