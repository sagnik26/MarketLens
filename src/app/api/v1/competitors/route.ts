/** GET/POST /api/v1/competitors — list and create competitors for Competitor Radar. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { competitorService } from "@/server/services/competitor.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "20");

  const result = await competitorService.list({ page, limit });
  return apiSuccess(result);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = (await req.json()) as { name?: string; website?: string; logoUrl?: string | null };
  const competitor = await competitorService.create({
    name: body.name ?? "",
    website: body.website ?? "",
    logoUrl: body.logoUrl ?? null,
  });
  return apiSuccess(competitor, 201);
});

