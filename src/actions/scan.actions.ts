/** Server Actions for starting a scan (run), fetching scan runs, and cancelling a run. */

"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { Change, Insight, ScanRunSummary } from "@/components/features/competitor-radar/competitor-radar.types";

/** Starts a manual scan for one competitor. Returns run id; client polls or uses SSE for progress. */
export async function runScanAction(competitorId: string): Promise<ActionResponse<{ runId: string }>> {
  return { success: false, error: "runScanAction is not yet wired to the scan backend." };
}

/** Returns recent changes for the authenticated company. Not implemented yet. */
export async function getChangesAction(): Promise<ActionResponse<Change[]>> {
  return { success: true, data: [] };
}

/** Returns recent insights. Not implemented yet. */
export async function getInsightsAction(): Promise<ActionResponse<Insight[]>> {
  return { success: true, data: [] };
}
