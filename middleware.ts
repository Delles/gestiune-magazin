import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware for authentication and route protection
 *
 * Handles:
 * - Authentication state checking
 * - Protected route access control
 * - Redirecting unauthenticated users to login
 * - Preventing authenticated users from accessing auth pages
 * - Proper async cookie handling
 *
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} The response or redirect
 */
export async function middleware(req: NextRequest) {
    try {
        // Create a response to modify
        const res = NextResponse.next();

        // Create the Supabase client
        const supabase = createMiddlewareClient({ req, res });

        // Await the session check
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        // Define protected and auth paths
        const protectedPaths = ["/dashboard", "/profile", "/settings"];
        const authPaths = ["/login", "/signup", "/reset-password"];

        const pathname = req.nextUrl.pathname;
        const isProtectedRoute = protectedPaths.some((path) =>
            pathname.startsWith(path)
        );
        const isAuthRoute = authPaths.some((path) => pathname.startsWith(path));

        // Handle protected routes - redirect to login if not authenticated
        if (isProtectedRoute && !session) {
            const redirectUrl = new URL("/login", req.url);
            redirectUrl.searchParams.set("redirect_to", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Handle auth routes - redirect to dashboard if already authenticated
        if (isAuthRoute && session) {
            const redirectTo =
                req.nextUrl.searchParams.get("redirect_to") || "/dashboard";
            return NextResponse.redirect(new URL(redirectTo, req.url));
        }

        // Return the response with updated cookies
        return res;
    } catch (error) {
        // Only log errors in development
        if (process.env.NODE_ENV === "development") {
            console.error("Middleware error:", error);
        }

        // On error, redirect to login for protected routes
        const pathname = req.nextUrl.pathname;
        const protectedPaths = ["/dashboard", "/profile", "/settings"];
        const isProtectedRoute = protectedPaths.some((path) =>
            pathname.startsWith(path)
        );

        if (isProtectedRoute) {
            const redirectUrl = new URL("/login", req.url);
            redirectUrl.searchParams.set("redirect_to", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // For other routes, continue without authentication
        return NextResponse.next();
    }
}

// Specify which paths should run this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
