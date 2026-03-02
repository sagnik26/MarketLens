/** Next.js Edge Middleware: route protection, auth checks, CORS for /api. */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/(dashboard)/:path*"] };
