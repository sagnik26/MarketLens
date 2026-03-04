import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authService } from "@/server/services/auth.service";
import { HttpError } from "@/server/api/errors";

export const runtime = "nodejs";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    throw new HttpError(
      422,
      "Email and password are required",
      "VALIDATION_ERROR",
    );
  }

  const { accessToken, refreshToken, userId, companyId, role } =
    await authService.login(email, password);

  const response = apiSuccess(
    {
      userId,
      companyId,
      role,
    },
    200,
  );

  response.headers.set(
    "Set-Cookie",
    `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Secure`,
  );
  response.headers.append(
    "Set-Cookie",
    `refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Secure`,
  );

  return response;
});
