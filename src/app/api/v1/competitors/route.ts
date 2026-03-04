/** GET/POST /api/v1/competitors — list and create competitors for Competitor Radar. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { competitorService } from "@/server/services/competitor.service";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) {
      throw new HttpError(401, "No company id in request", "UNAUTHORIZED");
    }

    const result = await competitorService.list(companyId, { page, limit });
    return apiSuccess(result);
  },
  { middleware: [authenticate] },
);

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) {
      throw new HttpError(401, "No company id in request", "UNAUTHORIZED");
    }

    const body = (await req.json()) as {
      name?: string;
      website?: string;
      logoUrl?: string | null;
    };
    const competitor = await competitorService.create(companyId, {
      name: body.name ?? "",
      website: body.website ?? "",
      logoUrl: body.logoUrl ?? null,
    });
    return apiSuccess(competitor, 201);
  },
  { middleware: [authenticate] },
);

