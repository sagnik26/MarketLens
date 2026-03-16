/** Insights page: backend-backed trend line + channel-filtered insight list. */

import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, DashboardShimmer } from "@/components/common";
import { getInsightsSummaryAction } from "@/actions/insights.actions";
import { InsightsTrendChart } from "@/components/features/insights/InsightsTrendChart";
import { InsightsDonutChart } from "@/components/features/insights/InsightsDonutChart";
import { TopCompetitorsBarChart } from "@/components/features/insights/TopCompetitorsBarChart";
import { MatchupSignalsChart } from "@/components/features/insights/MatchupSignalsChart";
import { SOURCE_CHANNEL_LABELS, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { battlecardService } from "@/server/services/battlecard.service";
import { timelineService } from "@/server/services/timeline.service";
import { getServerAuthContext } from "@/server/lib/auth/server-context";
import { productMatchupService } from "@/server/services/product-matchup.service";
import { changeRepository } from "@/server/repositories/change.repository";

type InsightsTab = "highlights" | "battlecards" | "timeline" | "matchups";

function isInsightsTab(value: string | undefined): value is InsightsTab {
  return (
    value === "highlights" ||
    value === "battlecards" ||
    value === "timeline" ||
    value === "matchups"
  );
}

function TabLink({
  href,
  isActive,
  label,
}: {
  href: string;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? "border-violet-500 bg-violet-600 text-white shadow-sm"
          : "border-neutral-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-violet-700"
      }`}
    >
      {label}
    </Link>
  );
}

async function HighlightsTab() {
  const result = await getInsightsSummaryAction();
  const summary = result.success && result.data ? result.data : null;
  const trendSeries = summary?.trendSeries ?? [];
  const insights = summary?.insights ?? [];
  const allChannels: (SourceChannelType | "all")[] = [
    "all",
    SourceChannel.PRICING,
    SourceChannel.JOBS,
    SourceChannel.PRODUCT,
    SourceChannel.FEATURES,
    SourceChannel.CHANGELOG,
    SourceChannel.REVIEWS,
  ];
  const palette = ["#6366f1", "#22c55e", "#f97316", "#e11d48", "#0ea5e9"];
  const allSeries = trendSeries.find((s) => s.channel === "all");
  const weekLabels =
    allSeries?.points.map((pt) => pt.weekLabel) ??
    Array.from(new Set(trendSeries.flatMap((s) => s.points.map((pt) => pt.weekLabel)))).sort(
      (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    );

  // Derive chart data for donuts and top competitors
  const byChannelMap = new Map<string, number>();
  const bySignalTypeMap = new Map<string, number>();
  const byPriorityMap = new Map<string, number>();
  const byCompetitorMap = new Map<string, number>();
  insights.forEach((i) => {
    const ch = i.pageType;
    const channelLabel =
      ch && ch in SOURCE_CHANNEL_LABELS ? SOURCE_CHANNEL_LABELS[ch as SourceChannelType] : "Other";
    byChannelMap.set(channelLabel, (byChannelMap.get(channelLabel) ?? 0) + (i.score ?? 1));
    const st = i.signalType ?? "informational";
    const signalLabel = st.charAt(0).toUpperCase() + st.slice(1);
    bySignalTypeMap.set(signalLabel, (bySignalTypeMap.get(signalLabel) ?? 0) + (i.score ?? 1));
    const pr = i.priority ?? "MEDIUM";
    byPriorityMap.set(pr, (byPriorityMap.get(pr) ?? 0) + (i.score ?? 1));
    const name = i.competitorName ?? "Unknown";
    byCompetitorMap.set(name, (byCompetitorMap.get(name) ?? 0) + (i.score ?? 1));
  });
  const byChannelLabels = Array.from(byChannelMap.keys()).sort(
    (a, b) => (byChannelMap.get(b) ?? 0) - (byChannelMap.get(a) ?? 0),
  );
  const byChannelValues = byChannelLabels.map((l) => byChannelMap.get(l) ?? 0);
  const bySignalTypeLabels = Array.from(bySignalTypeMap.keys()).sort(
    (a, b) => (bySignalTypeMap.get(b) ?? 0) - (bySignalTypeMap.get(a) ?? 0),
  );
  const bySignalTypeValues = bySignalTypeLabels.map((l) => bySignalTypeMap.get(l) ?? 0);
  const byPriorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const byPriorityLabels = byPriorityOrder.filter((p) => byPriorityMap.has(p));
  const byPriorityValues = byPriorityLabels.map((p) => byPriorityMap.get(p) ?? 0);
  const topCompetitors = Array.from(byCompetitorMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const topCompetitorLabels = topCompetitors.map(([n]) => n);
  const topCompetitorValues = topCompetitors.map(([, v]) => v);

  return (
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

      {/* Signal breakdown: donuts + top competitors */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Signal breakdown</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Distribution by channel, signal type, priority, and top competitors by volume.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/70">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              By channel
            </p>
            <InsightsDonutChart
              title="Signals by channel"
              labels={byChannelLabels}
              values={byChannelValues}
              emptyMessage="No channel data yet. Run scans to see distribution."
              className="h-[200px]"
            />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/70">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              By signal type
            </p>
            <InsightsDonutChart
              title="Signals by type"
              labels={bySignalTypeLabels}
              values={bySignalTypeValues}
              emptyMessage="No signal types yet."
              className="h-[200px]"
            />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/70">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              By priority
            </p>
            <InsightsDonutChart
              title="Signals by priority"
              labels={byPriorityLabels}
              values={byPriorityValues}
              emptyMessage="No priority data yet."
              className="h-[200px]"
            />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/70 sm:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Top competitors by signal count
            </p>
            <TopCompetitorsBarChart
              labels={topCompetitorLabels}
              values={topCompetitorValues}
              maxBars={8}
              emptyMessage="No competitor data yet."
              className="h-[220px]"
            />
          </div>
        </div>
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
                  channel === "all"
                    ? insights
                    : insights.filter((i) => (i.pageType as SourceChannelType | undefined) === channel);
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
                  Channels with the highest signal volume appear with stronger lines in the trend chart above and are
                  good candidates for deeper investigation this week.
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
                        {series.points.reduce((sum, pt) => sum + pt.totalSignals, 0)} signals
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

async function BattlecardsTab({ competitorId }: { competitorId?: string }) {
  const { companyId } = await getServerAuthContext();
  const { competitors } = await competitorRepository.findMany({
    companyId,
    page: 1,
    limit: 100,
  });

  const selected = competitorId ?? competitors[0]?.id;

  const data = selected
    ? await battlecardService
        .getForCompetitor({ companyId, competitorId: selected })
        .catch(() => null)
    : null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Battlecards</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        One-page competitor snapshots — recent moves, pricing, feature signals, hiring, changelog, and reviews.
      </p>

      {competitors.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No competitors yet"
            description="Add a competitor in Competitor Radar to generate a battlecard."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px,1fr]">
          <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Competitors
            </p>
            <ul className="space-y-1">
              {competitors.map((c) => {
                const isActive = c.id === selected;
                const href = `/dashboard/insights?tab=battlecards&competitorId=${encodeURIComponent(c.id)}`;
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-zinc-700 hover:bg-neutral-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className={`ml-2 text-xs ${isActive ? "text-white/80" : "text-zinc-400"}`}>
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/70">
            {!data ? (
              <EmptyState
                title="No battlecard data yet"
                description="Run scans for this competitor to populate signals, then return here."
              />
            ) : (
              <div className="space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {data.competitor.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {data.competitor.website}
                    </p>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {data.sections.map((section) => (
                    <section
                      key={section.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/30"
                    >
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {section.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {section.description}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {section.changes.map((chg) => (
                          <li key={chg.id} className="rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {chg.title}
                            </p>
                            {chg.summary && (
                              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                                {chg.summary}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                              {new Date(chg.detectedAt).toLocaleString()}
                              {chg.url ? (
                                <>
                                  {" "}
                                  ·{" "}
                                  <a
                                    className="underline underline-offset-2 hover:text-violet-600 dark:hover:text-violet-300"
                                    href={chg.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Source
                                  </a>
                                </>
                              ) : null}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

async function TimelineTab({ competitorId }: { competitorId?: string }) {
  const { companyId } = await getServerAuthContext();
  const { competitors } = await competitorRepository.findMany({
    companyId,
    page: 1,
    limit: 100,
  });

  const selected = competitorId ?? competitors[0]?.id;

  const data = selected
    ? await timelineService
        .getForCompetitor({ companyId, competitorId: selected, limit: 200 })
        .catch(() => null)
    : null;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Competitor timeline</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        A chronological feed of signals for one competitor across pricing, jobs, changelog, reviews, and more.
      </p>

      {competitors.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No competitors yet"
            description="Add a competitor in Competitor Radar to start building a timeline."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px,1fr]">
          <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Competitors
            </p>
            <ul className="space-y-1">
              {competitors.map((c) => {
                const isActive = c.id === selected;
                const href = `/dashboard/insights?tab=timeline&competitorId=${encodeURIComponent(c.id)}`;
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-zinc-700 hover:bg-neutral-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className={`ml-2 text-xs ${isActive ? "text-white/80" : "text-zinc-400"}`}>
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/70">
            {!data ? (
              <EmptyState
                title="No timeline data yet"
                description="Run scans for this competitor to populate signals, then return here."
              />
            ) : data.changes.length === 0 ? (
              <EmptyState
                title="No signals recorded"
                description="This competitor has no stored signals yet. Run a scan to generate changes."
              />
            ) : (
              <div className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {data.competitor.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {data.competitor.website}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Showing {Math.min(data.changes.length, 200)} most recent signals
                  </p>
                </header>

                <ol className="relative border-l border-neutral-200 pl-4 dark:border-neutral-800">
                  {data.changes.map((chg) => (
                    <li key={chg.id} className="mb-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-violet-500 dark:bg-violet-400" aria-hidden />
                      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {chg.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {new Date(chg.detectedAt).toLocaleString()}
                          </p>
                        </div>
                        {chg.summary && (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                            {chg.summary}
                          </p>
                        )}
                        {chg.url ? (
                          <p className="mt-2 text-xs">
                            <a
                              className="text-violet-700 underline underline-offset-2 hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
                              href={chg.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open source →
                            </a>
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

async function MatchupsTab() {
  const { companyId } = await getServerAuthContext();
  const matchups = await productMatchupService.list(companyId);

  const cards = await Promise.all(
    matchups.map(async (m) => {
      const recent = await changeRepository.findRecentByCompany({
        companyId,
        matchupId: m.id,
        limit: 200,
      });
      return {
        matchup: m,
        totalSignals: recent.length,
        lastSignalAt: recent[0]?.detectedAt ?? null,
      };
    }),
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Product matchups
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Visualize how many matchup-tagged signals each product comparison has generated. Each scan triggered from Product Matchups is stored with a dedicated
        <code className="mx-1">matchupId</code> so this chart can stay scoped to product vs competitor views.
      </p>

      {cards.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No matchups yet"
            description="Create a product matchup and run a scan to populate matchup-specific signals."
            actionHref="/dashboard/actions/product-matchups"
            actionLabel="Create product matchup"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Signals per matchup
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Bar chart of total matchup-tagged signals per product vs competitor pair.
            </p>
            <div className="mt-4">
              <MatchupSignalsChart
                labels={cards.map((card) => `${card.matchup.productName} vs ${card.matchup.competitorName}`)}
                totals={cards.map((card) => card.totalSignals)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Share of signals
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Donut: how much each matchup contributes to total signals.
              </p>
              <div className="mt-4">
                <InsightsDonutChart
                  title="Share of signals by matchup"
                  labels={cards.map((card) => `${card.matchup.productName} vs ${card.matchup.competitorName}`)}
                  values={cards.map((card) => card.totalSignals)}
                  emptyMessage="No matchup signals yet."
                  className="h-[220px]"
                />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs text-zinc-600 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-zinc-300">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Matchup summary
            </p>
            <ul className="space-y-2">
              {cards.map((card) => (
                <li key={card.matchup.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {card.matchup.productName} vs {card.matchup.competitorName}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Goal: {card.matchup.goal}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">
                      {card.totalSignals} signal{card.totalSignals === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {card.lastSignalAt ? new Date(card.lastSignalAt).toLocaleDateString() : "No signals yet"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              For deeper qualitative details (summary, pricing, messaging, feature signals, risks, and opportunities),
              open{" "}
              <Link
                href="/dashboard/information?tab=matchups"
                className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-300"
              >
                Information → Product matchups
              </Link>
              .
            </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InsightsContent({
  tab,
  competitorId,
}: {
  tab: InsightsTab;
  competitorId?: string;
}) {
  if (tab === "battlecards") return <BattlecardsTab competitorId={competitorId} />;
  if (tab === "timeline") return <TimelineTab competitorId={competitorId} />;
  if (tab === "matchups") return <MatchupsTab />;
  return <HighlightsTab />;
}

export default function InsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; competitorId?: string }>;
}) {
  const tabs: { id: InsightsTab; label: string }[] = [
    { id: "matchups", label: "Product Matchups" },
    { id: "highlights", label: "Competitor Highlights" },
  ];

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

        <div className="mt-6 flex flex-wrap gap-2">
          {/* URL-backed tabs so links are shareable and server-rendered */}
          {tabs.map((t) => (
            <Suspense key={t.id} fallback={null}>
              <TabResolver tab={t.id} label={t.label} searchParams={searchParams} />
            </Suspense>
          ))}
        </div>
      </header>

      <Suspense fallback={<DashboardShimmer />}>
        <InsightsTabResolver searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InsightsTabResolver({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; competitorId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const rawTab = sp.tab;
  const tab: InsightsTab = isInsightsTab(rawTab) ? rawTab : "matchups";
  return <InsightsContent tab={tab} competitorId={sp.competitorId} />;
}

async function TabResolver({
  tab,
  label,
  searchParams,
}: {
  tab: InsightsTab;
  label: string;
  searchParams?: Promise<{ tab?: string; competitorId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const rawTab = sp.tab;
  const activeTab: InsightsTab = isInsightsTab(rawTab) ? rawTab : "matchups";
  const isActive = activeTab === tab;

  const href =
    tab === "matchups"
      ? "/dashboard/insights"
      : `/dashboard/insights?tab=${encodeURIComponent(tab)}`;

  return <TabLink href={href} isActive={isActive} label={label} />;
}
