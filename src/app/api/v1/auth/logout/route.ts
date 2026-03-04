import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authService } from "@/server/services/auth.service";
import { authenticate } from "@/server/api/middleware/auth";

export const runtime = "nodejs";

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const payload = authService.getUserFromRequest(req);
    await authService.logout(payload.sub);

    const response = apiSuccess({ success: true }, 200);
    response.headers.set(
      "Set-Cookie",
      "access_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure",
    );
    response.headers.append(
      "Set-Cookie",
      "refresh_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure",
    );
    return response;
  },
  {
    middleware: [authenticate],
  },
);

