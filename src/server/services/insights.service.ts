/** Business logic for Insights summary; backed by MongoDB Change documents. */

import type { BackendInsight } from "@/types";
import type { InsightTrendPoint, InsightsSummary } from "@/actions/insights.actions";
import { changeRepository } from "@/server/repositories/change.repository";
import { SourceChannel } from "@/constants";

const DEMO_COMPANY_ID = "000000000000000000000000";

export const insightsService = {
  async getSummary(): Promise<InsightsSummary> {
    // Pull recent changes and derive simple insights + trend from them.
    const changes = await changeRepository.findRecentByCompany({
      companyId: DEMO_COMPANY_ID,
      limit: 200,
    });

    // Derive insights by grouping changes per competitor + pageType.
    const insightMap = new Map<string, BackendInsight>();

    changes.forEach((chg) => {
      const key = `${chg.competitorId ?? "global"}::${chg.pageType ?? "unknown"}`;
      const existing = insightMap.get(key);
      const count = (existing?.score ?? 0) + 1;

      const pageLabel =
        chg.pageType === SourceChannel.JOBS
          ? "jobs"
          : chg.pageType === SourceChannel.PRICING
            ? "pricing"
            : chg.pageType === SourceChannel.FEATURES
              ? "features"
              : "product signals";

      const title =
        chg.pageType === SourceChannel.JOBS
          ? `Hiring signals for ${chg.competitorName}`
          : `Signals from ${pageLabel} for ${chg.competitorName}`;

      const briefing = existing
        ? existing.briefing
        : `Recent ${pageLabel} activity detected for ${chg.competitorName}. Showing the most recent ${count} change(s).`;

      const insight: BackendInsight = {
        id: existing?.id ?? `insight-${key}`,
        competitorId: chg.competitorId,
        competitorName: chg.competitorName,
        title,
        briefing,
        signalType: chg.signalType,
        priority: chg.priority,
        recommendedActions: [],
        generatedAt: chg.detectedAt,
        pageType: chg.pageType,
        score: count,
        tags: existing?.tags ?? [pageLabel],
      };

      insightMap.set(key, insight);
    });

    const insights = Array.from(insightMap.values());

    // Very simple trend: group by ISO week label derived from generatedAt.
    const buckets = new Map<string, number>();

    insights.forEach((insight) => {
      const date = insight.generatedAt ? new Date(insight.generatedAt) : new Date();
      const year = date.getUTCFullYear();
      const week = getIsoWeekNumber(date);
      const label = `${year}-W${week}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });

    const trend: InsightTrendPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([weekLabel, totalSignals]) => ({ weekLabel, totalSignals }));

    return { trend, insights };
  },
};

function getIsoWeekNumber(date: Date): number {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
