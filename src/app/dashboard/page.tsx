/** Dashboard Overview: static module map + sample snapshot of key modules (no backend calls). */

import Link from "next/link";
import { InsightsTrendChart } from "@/components/features/insights/InsightsTrendChart";

const SAMPLE_COMPETITORS = [
  {
    name: "YC Jobs",
    url: "https://www.ycombinator.com/companies",
    channels: ["Jobs", "Features"],
    lastScan: "2 hours ago",
    signals: 12,
  },
  {
    name: "Stripe Pricing",
    url: "https://stripe.com/pricing",
    channels: ["Pricing", "Features"],
    lastScan: "Yesterday",
    signals: 7,
  },
  {
    name: "Notion Launches",
    url: "https://www.producthunt.com/products/notion",
    channels: ["Product Hunt"],
    lastScan: "3 days ago",
    signals: 4,
  },
] as const;

const SAMPLE_AGENTS = [
  { name: "scan-agent", status: "Running", detail: "YC Jobs · pricing + jobs" },
  { name: "insight-agent", status: "Idle", detail: "Waiting for new scans" },
  { name: "compliance-agent", status: "Idle", detail: "No circulars in queue" },
] as const;

const TOTAL_AGENTS = SAMPLE_AGENTS.length;
const RUNNING_AGENTS = SAMPLE_AGENTS.filter((a) => a.status === "Running").length;
const IDLE_AGENTS = TOTAL_AGENTS - RUNNING_AGENTS;

const SAMPLE_WEEK_LABELS = ["2026-W06", "2026-W07", "2026-W08", "2026-W09", "2026-W10"];

const SAMPLE_TREND_SERIES = [
  {
    id: "all",
    channel: "all",
    label: "All channels",
    points: [
      { weekLabel: "2026-W06", totalSignals: 3 },
      { weekLabel: "2026-W07", totalSignals: 6 },
      { weekLabel: "2026-W08", totalSignals: 4 },
      { weekLabel: "2026-W09", totalSignals: 9 },
      { weekLabel: "2026-W10", totalSignals: 7 },
    ],
  },
  {
    id: "jobs",
    channel: "jobs",
    label: "Jobs",
    points: [
      { weekLabel: "2026-W06", totalSignals: 1 },
      { weekLabel: "2026-W07", totalSignals: 3 },
      { weekLabel: "2026-W08", totalSignals: 2 },
      { weekLabel: "2026-W09", totalSignals: 5 },
      { weekLabel: "2026-W10", totalSignals: 3 },
    ],
  },
] as const;

export default function DashboardOverviewPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Overview
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Overview
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          High-level map of MarketLens modules. Use these tiles to jump into Competitor Radar, Insights,
          Information, Status, and Compliance Radar.
        </p>
      </header>

      {/* Module map */}
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-labelledby="modules-heading"
      >
        <h2 id="modules-heading" className="sr-only">
          Dashboard modules
        </h2>

        <Link
          href="/dashboard/actions/competitor-radar"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-800"
        >
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Core module
          </span>
          <span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
            Competitor Radar
          </span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage competitors, configure channels (pricing, jobs, Product Hunt, features), and trigger
            TinyFish-powered scans.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400">
            Go to Competitor Radar →
          </span>
        </Link>

        <Link
          href="/dashboard/actions/compliance"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-cyan-200 hover:shadow-[0_0_25px_-8px_rgba(8,145,178,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-cyan-800"
        >
          <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
            Regulatory
          </span>
          <span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
            Compliance Radar
          </span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Track BSE/NSE circulars and other regulatory changes that could impact your product, with links
            back to primary sources.
          </p>
          <span className="mt-4 text-sm font-medium text-cyan-600 dark:text-cyan-400">
            Go to Compliance Radar →
          </span>
        </Link>

        <Link
          href="/dashboard/insights"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-emerald-200 hover:shadow-[0_0_25px_-8px_rgba(16,185,129,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-800"
        >
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Analytics
          </span>
          <span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Insights
          </span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            See cross-competitor signal trends over time and prioritized insights grouped by source channel.
          </p>
          <span className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Go to Insights →
          </span>
        </Link>

        <Link
          href="/dashboard/information"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-sky-200 hover:shadow-[0_0_25px_-8px_rgba(56,189,248,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-sky-800"
        >
          <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
            Summaries
          </span>
          <span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
            Information
          </span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Channel-based summaries like YC jobs and pricing signals, with drill-down views per competitor and
            channel.
          </p>
          <span className="mt-4 text-sm font-medium text-sky-600 dark:text-sky-400">
            Go to Information →
          </span>
        </Link>

        <Link
          href="/dashboard/status"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-amber-200 hover:shadow-[0_0_25px_-8px_rgba(245,158,11,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-amber-800"
        >
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Live view
          </span>
          <span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
            Status
          </span>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            See which agents are running right now, active scans from Competitor Radar, and a history of recent
            runs.
          </p>
          <span className="mt-4 text-sm font-medium text-amber-600 dark:text-amber-400">
            Go to Status →
          </span>
        </Link>
      </section>

      {/* Static snapshots of key modules (no live data) */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-stretch">
        {/* Left column: Competitor + Compliance snapshots */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Competitor overview
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Illustration of how Competitor Radar can represent your market—competitors, their URLs, active
              channels, and detected signals.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              {SAMPLE_COMPETITORS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {c.url}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Channels: {c.channels.join(", ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {c.signals} signals
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Last scan: {c.lastScan}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <Link
                href="/dashboard/actions/competitor-radar"
                className="text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                Open full Competitor Radar →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Compliance snapshot
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              A small, static example of how Compliance Radar might summarize recent circulars and notices.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-700 dark:text-zinc-200">
              <li className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/70">
                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  BSE circular on disclosure norms
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Highlights new disclosure requirements for SaaS revenue recognition.
                </p>
              </li>
              <li className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/70">
                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  NSE clarification on data residency
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Notes stricter expectations for customer data storage regions.
                </p>
              </li>
            </ul>
            <div className="mt-3 text-right">
              <Link
                href="/dashboard/actions/compliance"
                className="text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
              >
                Open Compliance Radar →
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: Status + Insights snapshots */}
        <div className="flex flex-col gap-4 lg:h-full">
          <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-sm dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Agent activity
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Example of what the Status page shows when agents are running scans or waiting for new work.
            </p>
            <div className="mt-3 flex-1 space-y-3">
              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-200">
                {SAMPLE_AGENTS.map((agent) => (
                  <li
                    key={agent.name}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900/70"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          agent.status === "Running" ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                        {agent.name}
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {agent.detail}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-neutral-50 px-3 py-2 text-[11px] text-zinc-600 dark:bg-neutral-900/70 dark:text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>{TOTAL_AGENTS} agents</span>
                  <span className="font-medium text-emerald-500 dark:text-emerald-400">
                    {RUNNING_AGENTS} running
                  </span>
                </div>
                <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <span
                    className="bg-emerald-500"
                    style={{
                      width: `${TOTAL_AGENTS === 0 ? 0 : (RUNNING_AGENTS / TOTAL_AGENTS) * 100}%`,
                    }}
                  />
                  <span className="flex-1 bg-zinc-400/50" />
                </div>
                <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {IDLE_AGENTS} idle · Status page shows real-time values.
                </div>
              </div>
            </div>
            <div className="mt-3 text-right">
              <Link
                href="/dashboard/status"
                className="text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
              >
                View live Status →
              </Link>
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-sm dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Insights trend preview
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Static example of the Insights line chart using mock data; the real page uses the same layout
              with live signals.
            </p>
            <div className="mt-3 flex-1 w-full overflow-hidden">
              <InsightsTrendChart
                weekLabels={SAMPLE_WEEK_LABELS}
                // cast to any to avoid importing the InsightSeries type here; this is static demo data only
                trendSeries={SAMPLE_TREND_SERIES as any}
              />
            </div>
            <div className="mt-2 text-right">
              <Link
                href="/dashboard/insights"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                Open full Insights →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
