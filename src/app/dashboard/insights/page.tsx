/** Insights page: backend-backed trend line + channel-filtered insight list. */

import { EmptyState } from "@/components/common";
import { getInsightsSummaryAction } from "@/actions/insights.actions";
import { SOURCE_CHANNEL_LABELS, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M${first.x} ${first.y}`;
  if (rest.length > 0) {
    const segments = rest.map((pt) => `L ${pt.x} ${pt.y}`).join(" ");
    d += ` ${segments}`;
  }
  return d;
}

export default async function InsightsPage() {
  const result = await getInsightsSummaryAction();

  const allChannels: (SourceChannelType | "all")[] = [
    "all",
    SourceChannel.PRICING,
    SourceChannel.JOBS,
    SourceChannel.PRODUCT_HUNT,
    SourceChannel.FEATURES,
  ];

  const summary = result.success && result.data ? result.data : null;
  const trend = summary?.trend ?? [];
  const maxSignals = trend.reduce((max, pt) => (pt.totalSignals > max ? pt.totalSignals : max), 0);
  const yScale = maxSignals > 0 ? 80 / maxSignals : 1;

  const svgPoints = trend.map((pt, idx) => ({
    x: 10 + (idx / Math.max(1, trend.length - 1)) * 300,
    y: 120 - pt.totalSignals * yScale,
  }));

  const linePath = buildLinePath(svgPoints);

  const insights = summary?.insights ?? [];

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

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Insight trend</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Line chart showing how total signals move week over week. Real data will appear here once scans are persisted.
        </p>

        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900/70">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Signals over time</span>
            <span>{trend.length} weeks</span>
          </div>
          <div className="h-40 w-full">
            {trend.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No trend data yet. Run a few scans from Competitor Radar to populate this view.
              </p>
            ) : (
              <svg viewBox="0 0 320 160" className="h-full w-full">
                <defs>
                  <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g strokeWidth="0.5" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700">
                  <line x1="0" y1="20" x2="320" y2="20" />
                  <line x1="0" y1="60" x2="320" y2="60" />
                  <line x1="0" y1="100" x2="320" y2="100" />
                  <line x1="0" y1="140" x2="320" y2="140" />
                </g>
                {linePath && (
                  <>
                    <path
                      d={`${linePath} L 310 160 L 10 160 Z`}
                      fill="url(#line-gradient)"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      strokeWidth="2.5"
                      className="stroke-violet-500 dark:stroke-violet-400"
                    />
                    <g className="fill-white stroke-violet-500 dark:stroke-violet-400">
                      {svgPoints.map((pt, idx) => (
                        <circle key={trend[idx]?.weekLabel ?? idx} cx={pt.x} cy={pt.y} r="3" />
                      ))}
                    </g>
                  </>
                )}
              </svg>
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Each point represents the total number of signals generated across all competitors in that week.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Insights by channel</h3>
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
          </div>

          <div className="flex items-stretch">
            <EmptyState
              title="No insights available"
              description="Once TinyFish-driven scans are stored, this panel will reflect real signal trends and recommended actions."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

