"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
    session: Session | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get initial session
                const {
                    data: { session: initialSession },
                    error,
                } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(initialSession);
                setIsLoading(false);
            } catch (error) {
                console.error("Error initializing auth:", error);
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session) => {
                setSession(session);

                if (process.env.NODE_ENV === "development") {
                    console.log("Auth state changed:", {
                        event,
                        hasSession: !!session,
                    });
                }

                // Handle auth events
                switch (event) {
                    case "SIGNED_IN":
                        if (process.env.NODE_ENV === "development") {
                            console.log(
                                "Auth context: SIGNED_IN event - NOT triggering refresh/redirect"
                            );
                        }
                        // Don't call router.refresh() as it might interfere with
                        // the intended redirect from the login form
                        break;
                    case "SIGNED_OUT":
                        router.refresh();
                        router.push("/login");
                        toast.success("Successfully signed out!");
                        break;
                    case "USER_UPDATED":
                        setSession(session);
                        toast.success("Profile updated!");
                        break;
                    case "TOKEN_REFRESHED":
                        setSession(session);
                        break;
                    case "PASSWORD_RECOVERY":
                        router.push("/reset-password/update");
                        toast.info("Please reset your password.");
                        break;
                }
            }
        );

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    return (
        <AuthContext.Provider value={{ session, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
