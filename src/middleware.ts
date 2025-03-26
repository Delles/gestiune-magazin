// src/middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function middleware(req: NextRequest) {
    // console.log(`---> Middleware running for: ${req.nextUrl.pathname}`); // Optional: Keep this top-level log if helpful
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req, res });
    const { pathname } = req.nextUrl;

    try {
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession(); // Refresh session

        // Optional: Log session errors if they occur
        if (sessionError) {
            console.error(
                `[Middleware] Session Error for path ${pathname}:`,
                sessionError.message
            );
        }

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
            // console.log(`[Middleware] Redirecting unauthenticated from ${pathname} to /login`); // Optional log
            return NextResponse.redirect(redirectUrl);
        }

        // Redirect authenticated users from auth routes
        if (isAuthRoute && session) {
            const redirectTo =
                req.nextUrl.searchParams.get("redirect_to") || "/dashboard";
            const redirectUrl = new URL(redirectTo, req.url);
            // console.log(`[Middleware] Redirecting authenticated from ${pathname} to ${redirectTo}`); // Optional log
            return NextResponse.redirect(redirectUrl);
        }

        // console.log(`[Middleware] Allowing access to ${pathname}`); // Optional log
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
