/** POST /api/v1/scan/run/stream: trigger scan and return SSE stream (events + STREAMING_URL for iframe). */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { scanService, type StreamingScanEvent } from "@/server/services/scan.service";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { HttpError } from "@/server/api/errors";

export const runtime = "nodejs";

interface RunScanBody {
  competitorIds: string[];
  channels: SourceChannelType[];
}

function encodeSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = (await req.json()) as Partial<RunScanBody>;
  const competitorIds = body.competitorIds ?? [];
  const channels = body.channels ?? [SourceChannel.PRICING];

  if (!Array.isArray(competitorIds) || competitorIds.length === 0) {
    throw new HttpError(422, "competitorIds array is required", "VALIDATION_ERROR");
  }

  if (!Array.isArray(channels) || channels.length === 0) {
    throw new HttpError(422, "channels array is required", "VALIDATION_ERROR");
  }

  const DEMO_COMPANY_ID = "000000000000000000000000";
  const { competitors } = await competitorRepository.findMany({
    companyId: DEMO_COMPANY_ID,
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
          // already closed (e.g. client disconnected)
        }
      };

      scanService
        .runCompetitorScanStreaming(pages, (event: StreamingScanEvent) => {
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
                /** Full result payload — same shape as POST /api/v1/scan/run for inspection in Network tab. */
                data: {
                  scanRun: result.scanRun,
                  changes: result.changes,
                  insights: result.insights,
                },
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
});
