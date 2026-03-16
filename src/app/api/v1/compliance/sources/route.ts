/** GET /api/v1/compliance/sources — list compliance sources for the authenticated company. */

import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { complianceService } from "@/server/services/compliance.service";

export const runtime = "nodejs";

const COMPLIANCE_SOURCES_CACHE_TAG = "compliance-sources";
const COMPLIANCE_SOURCES_CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");
    const sources = await unstable_cache(
      () => complianceService.listSources(companyId),
      [COMPLIANCE_SOURCES_CACHE_TAG, "list", companyId],
      {
        revalidate: COMPLIANCE_SOURCES_CACHE_REVALIDATE_SECONDS,
        tags: [COMPLIANCE_SOURCES_CACHE_TAG],
      },
    )();
    return apiSuccess(sources);
  },
  { middleware: [authenticate] },
);
