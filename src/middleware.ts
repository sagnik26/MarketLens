/** Next.js Edge Middleware: route protection, auth checks, CORS for /api. */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;

  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute = pathname.startsWith("/api/v1/auth");
  const isHealthRoute = pathname === "/api/health";
  const isWebhookRoute = pathname.startsWith("/api/v1/webhooks");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // Allow public API routes (auth, health, webhooks) through without checks.
  if (isApiRoute && (isAuthRoute || isHealthRoute || isWebhookRoute)) {
    return NextResponse.next();
  }

  // Protect API routes: require an access_token for everything else under /api.
  if (isApiRoute && !accessToken) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  // Protect dashboard routes: redirect to login if not authenticated.
  if (isDashboardRoute && !accessToken) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/(dashboard)/:path*"] };
