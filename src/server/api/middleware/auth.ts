/** Authentication middleware: verify access token and set x-user-id / x-user-role / x-company-id on request. */

import type { NextRequest } from "next/server";
import { authService } from "@/server/services/auth.service";
import { HttpError } from "@/server/api/errors";

export async function authenticate(req: NextRequest): Promise<void> {
  const token =
    req.cookies.get("access_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    "";

  if (!token) {
    throw new HttpError(401, "No access token provided", "UNAUTHORIZED");
  }

  const payload = authService.getUserFromRequest(req);

  req.headers.set("x-user-id", payload.sub);
  req.headers.set("x-user-role", payload.role);
  req.headers.set("x-company-id", payload.companyId);
}

export function authorize(...roles: string[]) {
  return async (req: NextRequest): Promise<void> => {
    const role = req.headers.get("x-user-role");
    if (!role || !roles.includes(role)) {
      throw new HttpError(403, "Forbidden", "FORBIDDEN");
    }
  };
}
