/** POST /api/v1/scan/run: trigger TinyFish scan for one or more competitors (Competitor Radar). */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { scanService } from "@/server/services/scan.service";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { HttpError } from "@/server/api/errors";
import { authenticate } from "@/server/api/middleware/auth";

export const runtime = "nodejs";

interface RunScanBody {
  competitorIds: string[];
  channels: SourceChannelType[];
}

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const body = (await req.json()) as Partial<RunScanBody>;
    const competitorIds = body.competitorIds ?? [];
    const channels = body.channels ?? [SourceChannel.PRICING];

    if (!Array.isArray(competitorIds) || competitorIds.length === 0) {
      throw new HttpError(422, "competitorIds array is required", "VALIDATION_ERROR");
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      throw new HttpError(422, "channels array is required", "VALIDATION_ERROR");
    }

    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) {
      throw new HttpError(401, "No company id in request", "UNAUTHORIZED");
    }

    const { competitors } = await competitorRepository.findMany({
      companyId,
      page: 1,
      limit: 100,
    });

    const selected = competitors.filter((c: { id: string }) => competitorIds.includes(c.id));
    if (selected.length === 0) {
      throw new HttpError(404, "No matching competitors found", "NOT_FOUND");
    }

    const pages = selected.flatMap((competitor: { id: string; name: string; website: string }) =>
      channels.map((channel) => ({
        competitorId: competitor.id,
        competitorName: competitor.name,
        url: competitor.website,
        channel,
      })),
    );

    const result = await scanService.runCompetitorScan(companyId, pages);

    return apiSuccess(result, 201);
  },
  { middleware: [authenticate] },
);

