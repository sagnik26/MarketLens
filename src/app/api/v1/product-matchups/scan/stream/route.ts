/** POST /api/v1/product-matchups/scan/stream: trigger a matchup scan and return SSE stream. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { scanService, type StreamingScanEvent } from "@/server/services/scan.service";
import { productMatchupService } from "@/server/services/product-matchup.service";

export const runtime = "nodejs";

interface RunMatchupScanBody {
  matchupId: string;
  channels: SourceChannelType[];
}

function encodeSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const body = (await req.json().catch(() => ({}))) as Partial<RunMatchupScanBody>;
    const matchupId = body.matchupId ?? "";
    const channels = body.channels ?? [SourceChannel.PRODUCT];

    if (!matchupId) throw new HttpError(422, "matchupId is required", "VALIDATION_ERROR");
    if (!Array.isArray(channels) || channels.length === 0) {
      throw new HttpError(422, "channels array is required", "VALIDATION_ERROR");
    }

    const matchup = await productMatchupService.getById(companyId, matchupId);

    const pages = channels.map((channel) => ({
      competitorId: matchup.competitorId,
      competitorName: matchup.competitorName,
      url: matchup.competitorUrl,
      channel,
      matchupId: matchup.id,
      matchupContext: {
        productName: matchup.productName,
        productSegment: matchup.productSegment,
        productPositioning: matchup.productPositioning,
        productPricingModel: matchup.productPricingModel,
        productUrl: matchup.productUrl,
        competitorUrl: matchup.competitorUrl,
        goal: matchup.goal,
      },
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        let closed = false;

        const safeEnqueue = (data: Uint8Array) => {
          if (closed) return;
          try {
            controller.enqueue(data);
          } catch {
            closed = true;
          }
        };

        const safeClose = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // ignore
          }
        };

        scanService
          .runCompetitorScanStreaming(companyId, pages, (event: StreamingScanEvent) => {
            safeEnqueue(encoder.encode(encodeSSE(event)));
          })
          .then((result) => {
            safeEnqueue(
              encoder.encode(
                encodeSSE({
                  type: "COMPLETE",
                  status: result.scanRun.status,
                  scanRunId: result.scanRun.id,
                  totalSignals: result.scanRun.totalSignals,
                  totalInsights: result.scanRun.totalInsights,
                  totalCompetitors: result.scanRun.totalCompetitors,
                  errorMessage: result.scanRun.errorMessage,
                  matchupId: matchup.id,
                }),
              ),
            );
            safeClose();
          })
          .catch((err) => {
            safeEnqueue(
              encoder.encode(
                encodeSSE({
                  type: "ERROR",
                  error: err instanceof Error ? err.message : String(err),
                }),
              ),
            );
            safeClose();
          });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-cache",
        Connection: "keep-alive",
      },
    });
  },
  { middleware: [authenticate] },
);

