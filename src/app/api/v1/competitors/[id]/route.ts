/** GET/PATCH/DELETE /api/v1/competitors/:id — single competitor operations. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { competitorService } from "@/server/services/competitor.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const competitor = await competitorService.getById(id);
  return apiSuccess(competitor);
});

export const PATCH = withApiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    website?: string;
    logoUrl?: string | null;
    isActive?: boolean;
  };
  const competitor = await competitorService.update(id, body);
  return apiSuccess(competitor);
});

export const DELETE = withApiHandler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  await competitorService.delete(id);
  return apiSuccess(null, 204);
});

