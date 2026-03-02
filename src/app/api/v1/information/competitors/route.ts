/** GET /api/v1/information/competitors — competitor + compliance information summary for Information page. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { informationService } from "@/server/services/information.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const summary = await informationService.getSummary();
  return apiSuccess(summary);
});

