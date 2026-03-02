/** GET /api/v1/insights/summary — trend + channel-filtered insights summary for Insights page. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { insightsService } from "@/server/services/insights.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const summary = await insightsService.getSummary();
  return apiSuccess(summary);
});

