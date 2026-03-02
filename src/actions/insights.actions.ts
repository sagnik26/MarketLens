/** Server Action: returns backend-backed insight trend and channel list. */
"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { BackendInsight } from "@/types";
import { insightsService } from "@/server/services/insights.service";

export interface InsightTrendPoint {
  weekLabel: string;
  totalSignals: number;
}

export interface InsightsSummary {
  trend: InsightTrendPoint[];
  insights: BackendInsight[];
}

export async function getInsightsSummaryAction(): Promise<ActionResponse<InsightsSummary>> {
  const summary = await insightsService.getSummary();
  return {
    success: true,
    data: summary,
  };
}


