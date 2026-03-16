/** Server Action: returns backend-backed insight trend and channel list. */
"use server";

import { unstable_cache } from "next/cache";
import type { ActionResponse } from "@/types/actions.types";
import type { BackendInsight } from "@/types";
import type { SourceChannel } from "@/constants";
import { insightsService } from "@/server/services/insights.service";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

const CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes
const INSIGHTS_TAG = "insights";

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

async function getInsightsSummaryCached(companyId: string): Promise<InsightsSummary> {
  return unstable_cache(
    async () => insightsService.getSummary(companyId),
    [INSIGHTS_TAG, "summary", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [INSIGHTS_TAG] }
  )();
}

export async function getInsightsSummaryAction(): Promise<ActionResponse<InsightsSummary>> {
  const { companyId } = await getServerAuthContext();
  const summary = await getInsightsSummaryCached(companyId);
  return {
    success: true,
    data: summary,
  };
}


