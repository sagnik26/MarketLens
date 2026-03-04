import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authService } from "@/server/services/auth.service";
import { HttpError } from "@/server/api/errors";

export const runtime = "nodejs";

export const POST = withApiHandler(async (req: NextRequest) => {
  const refreshToken =
    req.cookies.get("refresh_token")?.value ??
    (await req.json().catch(() => ({} as { refreshToken?: string }))).refreshToken;

  if (!refreshToken) {
    throw new HttpError(401, "No refresh token provided", "UNAUTHORIZED");
  }

  const { accessToken, user } = await authService.refresh(refreshToken);

  const response = apiSuccess(
    {
      user,
    },
    200,
  );

  response.headers.set(
    "Set-Cookie",
    `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Secure`,
  );

  return response;
});
