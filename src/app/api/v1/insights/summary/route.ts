/** GET /api/v1/insights/summary — trend + channel-filtered insights summary for Insights page. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { insightsService } from "@/server/services/insights.service";
import { HttpError } from "@/server/api/errors";
import { authenticate } from "@/server/api/middleware/auth";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) {
      throw new HttpError(401, "No company id in request", "UNAUTHORIZED");
    }
    const summary = await insightsService.getSummary(companyId);
    return apiSuccess(summary);
  },
  { middleware: [authenticate] },
);

