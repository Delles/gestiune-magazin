// src/app/middleware.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Define protected and auth paths
    const protectedPaths = ["/dashboard", "/profile", "/settings"];
    const authPaths = ["/login", "/signup"];

    const pathname = req.nextUrl.pathname;
    const isProtectedRoute = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );
    const isAuthRoute = authPaths.some((path) => pathname === path);

    // Handle protected routes - redirect to login if not authenticated
    if (isProtectedRoute && !session) {
        const redirectUrl = new URL("/login", req.url);
        redirectUrl.searchParams.set("redirect_to", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Handle auth routes - redirect to dashboard if already authenticated
    if (isAuthRoute && session) {
        // Get the intended destination from redirect_to or default to dashboard
        const redirectTo =
            req.nextUrl.searchParams.get("redirect_to") || "/dashboard";
        return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    // Update session
    return res;
}

// Specify which paths should run this middleware
export const config = {
    matcher: [
        // Protected routes
        "/dashboard/:path*",
        "/profile/:path*",
        "/settings/:path*",
        // Auth routes
        "/login",
        "/signup",
    ],
};
