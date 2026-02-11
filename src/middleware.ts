// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const session = await auth(); // ← this gets the session/token
    const pathname = request.nextUrl.pathname;

    // 1. Require login for all /admin paths
    if (pathname.startsWith("/admin")) {
        if (!session) {
            // Not logged in → redirect to login page
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Logged in but not ADMIN → redirect to home
        if (session.user?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // All good → continue
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",      // Protect everything under /admin
        // Add more if needed, e.g. "/billing/:path*"
    ],
};