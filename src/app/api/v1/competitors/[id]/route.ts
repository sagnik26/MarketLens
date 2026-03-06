/** GET/PATCH/DELETE /api/v1/competitors/:id — single competitor operations. */

import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { competitorService } from "@/server/services/competitor.service";
import { authenticate } from "@/server/api/middleware/auth";

export const runtime = "nodejs";

const COMPETITORS_CACHE_TAG = "competitors";

export const GET = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const companyId = req.headers.get("x-company-id") ?? "";
    const competitor = await competitorService.getById(companyId, id);
    return apiSuccess(competitor);
  },
  { middleware: [authenticate] },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const companyId = req.headers.get("x-company-id") ?? "";
    const body = (await req.json()) as {
      name?: string;
      website?: string;
      logoUrl?: string | null;
      isActive?: boolean;
    };
    const competitor = await competitorService.update(companyId, id, body);
    revalidateTag(COMPETITORS_CACHE_TAG);
    return apiSuccess(competitor);
  },
  { middleware: [authenticate] },
);

export const DELETE = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const companyId = req.headers.get("x-company-id") ?? "";
    await competitorService.delete(companyId, id);
    revalidateTag(COMPETITORS_CACHE_TAG);
    return apiSuccess(null, 204);
  },
  { middleware: [authenticate] },
);

