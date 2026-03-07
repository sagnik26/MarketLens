/** GET/PATCH/DELETE /api/v1/flows/:id — single flow operations. */

import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { flowService } from "@/server/services/flow.service";
import { FlowTriggerEventType } from "@/server/models/Flow.model";

export const runtime = "nodejs";

const FLOWS_CACHE_TAG = "flows";

const flowActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("webhook"),
    url: z.string().url("Invalid webhook URL").max(2000),
    method: z.string().max(10).optional(),
    headers: z.record(z.string()).optional(),
    label: z.string().max(200).optional(),
  }),
  z.object({
    type: z.literal("slack"),
    url: z.string().url("Invalid Slack webhook URL").max(2000),
    label: z.string().max(200).optional(),
  }),
]);

const updateFlowBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isEnabled: z.boolean().optional(),
  trigger: z
    .object({
      eventType: z.enum([
        FlowTriggerEventType.CHANGE_CREATED,
        FlowTriggerEventType.INSIGHT_CREATED,
        FlowTriggerEventType.SCAN_COMPLETED,
        FlowTriggerEventType.COMPLIANCE_SCAN_COMPLETED,
      ]),
    })
    .optional(),
  competitorId: z.string().nullable().optional(),
  complianceSourceId: z.string().nullable().optional(),
  matchupId: z.string().nullable().optional(),
  actions: z.array(flowActionSchema).min(1).optional(),
});

export const GET = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const flow = await flowService.getById(companyId, id);
    return apiSuccess(flow);
  },
  { middleware: [authenticate] },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const raw = await req.json().catch(() => ({}));
    const parse = updateFlowBodySchema.safeParse(raw);
    if (!parse.success) {
      const message =
        parse.error.flatten().fieldErrors.name?.[0] ??
        parse.error.flatten().fieldErrors.trigger?.[0] ??
        parse.error.flatten().fieldErrors.actions?.[0] ??
        parse.error.message;
      throw new HttpError(422, String(message), "VALIDATION_ERROR");
    }

    const updated = await flowService.update(companyId, id, parse.data);
    revalidateTag(FLOWS_CACHE_TAG);
    return apiSuccess(updated);
  },
  { middleware: [authenticate] },
);

const objectIdRegex = /^[a-f\d]{24}$/i;

export const DELETE = withApiHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const params = await ctx.params;
    const id = params?.id;
    if (!id || typeof id !== "string" || !objectIdRegex.test(id)) {
      throw new HttpError(400, "Invalid flow id", "VALIDATION_ERROR");
    }
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    await flowService.delete(companyId, id);
    revalidateTag(FLOWS_CACHE_TAG);
    return apiSuccess(null, 204);
  },
  { middleware: [authenticate] },
);
