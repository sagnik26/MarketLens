import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { userRepository } from "@/server/repositories/user.repository";
import { HttpError } from "@/server/api/errors";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found", "NOT_FOUND");
    }

    return apiSuccess(user);
  },
  { middleware: [authenticate] },
);

