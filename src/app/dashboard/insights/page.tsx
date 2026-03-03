/** Insights page: backend-backed trend line + channel-filtered insight list. */

import { Suspense } from "react";
import { EmptyState, DashboardShimmer } from "@/components/common";
import { getInsightsSummaryAction } from "@/actions/insights.actions";
import { SOURCE_CHANNEL_LABELS, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { InsightsTrendChart } from "@/components/features/insights/InsightsTrendChart";

async function InsightsContent() {
  const result = await getInsightsSummaryAction();

  const allChannels: (SourceChannelType | "all")[] = [
    "all",
    SourceChannel.PRICING,
    SourceChannel.JOBS,
    SourceChannel.PRODUCT,
    SourceChannel.FEATURES,
    SourceChannel.REVIEWS,
  ];

  const summary = result.success && result.data ? result.data : null;
  const trendSeries = summary?.trendSeries ?? [];
  const insights = summary?.insights ?? [];

  const palette = ["#6366f1", "#22c55e", "#f97316", "#e11d48", "#0ea5e9"];

  const allPoints = trendSeries.flatMap((series) => series.points);
  const weekLabels = Array.from(
    new Set(allPoints.map((pt) => pt.weekLabel)),
  ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Insight trend</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Line chart showing how total signals move week over week. Real data will appear here once scans are persisted.
        </p>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-4 sm:px-4 dark:border-neutral-700 dark:bg-neutral-900/70">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Signals over time</span>
            <span>{weekLabels.length} weeks</span>
          </div>
          <div className="mt-4 h-64 w-full">
            <InsightsTrendChart weekLabels={weekLabels} trendSeries={trendSeries} />
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Each point represents the total number of signals generated across all competitors in that week.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Insights by channel</h2>
            {insights.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No insights yet"
                  description="Once scans have created a few runs, this section will show prioritized insights grouped by source channel."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {allChannels.map((channel) => {
                  const filtered =
                    channel === "all" ? insights : insights.filter((i) => (i.pageType as SourceChannelType | undefined) === channel);
                  if (filtered.length === 0) return null;

                  return (
                    <section key={channel === "all" ? "all" : channel}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {channel === "all" ? "All insights" : SOURCE_CHANNEL_LABELS[channel]}
                      </h4>
                      <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                        {filtered.map((insight) => (
                          <li
                            key={insight.id}
                            className="rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/60"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {insight.title}
                                </p>
                                <p className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300 line-clamp-2">
                                  {insight.briefing}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                {insight.priority}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Summary</h2>
            {insights.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="No insights available"
                  description="Once TinyFish-driven scans are stored, this panel will reflect real signal trends and recommended actions."
                />
              </div>
            ) : (
              <div className="mt-3 flex w-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-zinc-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-zinc-200">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {insights.length} insight{insights.length === 1 ? "" : "s"} derived from recent signals across{" "}
                    {allChannels.length - 1} channels.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Channels with the highest signal volume appear with stronger lines in the trend chart above and are good
                    candidates for deeper investigation this week.
                  </p>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {trendSeries
                    .filter((s) => s.channel !== "all")
                    .map((series, idx) => (
                      <li key={series.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-6 rounded-full"
                            style={{ backgroundColor: palette[(idx + 1) % palette.length] }}
                          />
                          <span>{series.label}</span>
                        </span>
                        <span className="font-medium">
                          {series.points.reduce(
                            (sum, pt) => sum + pt.totalSignals,
                            0,
                          )}{" "}
                          signals
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  );
}

export default function InsightsPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Insights
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Insights
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Cross-competitor insights, trends, and recommended actions, grouped by source channel.
        </p>
      </header>

      <Suspense fallback={<DashboardShimmer />}>
        <InsightsContent />
      </Suspense>
    </div>
  );
}
