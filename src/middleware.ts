// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function middleware(req: NextRequest) {
    // Create a response object
    const res = NextResponse.next();

    // Create Supabase client with ssr package using the new non-deprecated methods
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                        res.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    });
                },
            },
        }
    );

    const { pathname } = req.nextUrl;

    try {
        // Get session before anything else
        const {
            data: { session },
        } = await supabase.auth.getSession(); // Refresh session

        // Define path groups
        const protectedPaths = ["/dashboard", "/settings"];
        const authPaths = ["/login", "/signup", "/reset-password"];

        const isProtectedRoute = protectedPaths.some((path) =>
            pathname.startsWith(path)
        );
        const isAuthRoute = authPaths.some((path) => pathname.startsWith(path));

        // Redirect unauthenticated users from protected routes
        if (isProtectedRoute && !session) {
            const redirectUrl = new URL("/login", req.url);
            redirectUrl.searchParams.set("redirect_to", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Redirect authenticated users from auth routes
        if (isAuthRoute && session) {
            const redirectTo =
                req.nextUrl.searchParams.get("redirect_to") || "/dashboard";
            const redirectUrl = new URL(redirectTo, req.url);
            return NextResponse.redirect(redirectUrl);
        }

        return res; // Allow request and set cookie
    } catch (error) {
        console.error(
            `[Middleware] UNEXPECTED ERROR for path ${pathname}:`,
            error
        );
        // Allow request to proceed on unexpected errors, but log it.
        return res;
    }
}

// Config matcher remains the same
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
