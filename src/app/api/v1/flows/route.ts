/** GET/POST /api/v1/flows — list and create automation flows. */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { flowService } from "@/server/services/flow.service";
import { FlowTriggerEventType } from "@/server/models/Flow.model";

export const runtime = "nodejs";

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

const createFlowBodySchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  isEnabled: z.boolean().optional(),
  trigger: z.object({
    eventType: z.enum([
      FlowTriggerEventType.CHANGE_CREATED,
      FlowTriggerEventType.INSIGHT_CREATED,
      FlowTriggerEventType.SCAN_COMPLETED,
    ]),
  }),
  actions: z
    .array(flowActionSchema)
    .min(1, "At least one action is required"),
});

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const flows = await flowService.list(companyId);
    return apiSuccess(flows);
  },
  { middleware: [authenticate] },
);

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const raw = await req.json().catch(() => ({}));
    const parse = createFlowBodySchema.safeParse(raw);
    if (!parse.success) {
      const first = parse.error.flatten().fieldErrors;
      const message =
        first.name?.[0] ??
        first.trigger?.[0] ??
        first.actions?.[0] ??
        parse.error.message;
      throw new HttpError(422, String(message), "VALIDATION_ERROR");
    }

    const created = await flowService.create(companyId, parse.data);
    return apiSuccess(created, 201);
  },
  { middleware: [authenticate] },
);
