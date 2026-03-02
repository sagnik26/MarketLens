/** Server Actions for starting a scan (run), fetching scan runs, and cancelling a run. */

"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { Change, Insight, ScanRunSummary } from "@/components/features/competitor-radar/competitor-radar.types";

/** Starts a manual scan for one competitor. Returns run id; client polls or uses SSE for progress. */
export async function runScanAction(competitorId: string): Promise<ActionResponse<{ runId: string }>> {
  return { success: true, data: { runId: `run_${competitorId}_${Date.now()}` } };
}

/** Returns recent changes for the authenticated company. Mock for UI. */
export async function getChangesAction(): Promise<ActionResponse<Change[]>> {
  const mock: Change[] = [
    {
      id: "c1",
      competitorId: "1",
      competitorName: "Acme Corp",
      changeType: "pricing",
      signalType: "threat",
      priority: "HIGH",
      title: "New Pro tier launched",
      summary: "Acme added a Pro plan at $49/mo.",
      isRead: false,
      isDismissed: false,
      detectedAt: new Date().toISOString(),
    },
  ];
  return { success: true, data: mock };
}

/** Returns recent insights. Mock for UI. */
export async function getInsightsAction(): Promise<ActionResponse<Insight[]>> {
  const mock: Insight[] = [
    {
      id: "i1",
      competitorId: "1",
      competitorName: "Acme Corp",
      title: "Pricing and hiring shift",
      briefing: "Acme launched a Pro tier and is hiring for enterprise sales.",
      signalType: "threat",
      priority: "HIGH",
      recommendedActions: ["Review our Pro positioning", "Compare feature matrix"],
      generatedAt: new Date().toISOString(),
    },
  ];
  return { success: true, data: mock };
}
