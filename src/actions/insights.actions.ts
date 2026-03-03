/** Server Action: returns backend-backed insight trend and channel list. */
"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { BackendInsight } from "@/types";
import type { SourceChannel } from "@/constants";
import { insightsService } from "@/server/services/insights.service";

export interface InsightTrendPoint {
  weekLabel: string;
  totalSignals: number;
}

export interface InsightSeriesPoint {
  weekLabel: string;
  totalSignals: number;
}

export interface InsightSeries {
  id: string;
  channel: SourceChannel | "all";
  label: string;
  points: InsightSeriesPoint[];
}

export interface InsightsSummary {
  trend: InsightTrendPoint[];
  trendSeries: InsightSeries[];
  insights: BackendInsight[];
}

export async function getInsightsSummaryAction(): Promise<ActionResponse<InsightsSummary>> {
  const summary = await insightsService.getSummary();
  return {
    success: true,
    data: summary,
  };
}


