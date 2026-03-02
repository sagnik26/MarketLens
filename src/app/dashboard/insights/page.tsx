/** Insights page: insights about the whole (cross-competitor). */

import Link from "next/link";
import { EmptyState } from "@/components/common";

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
          Cross-competitor insights, trends, and recommended actions.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Insight trend</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Mock line chart showing how total signals might move week over week. Real data will come from scan runs.
        </p>

        {/* Sample line chart (mock trend over time, multi-point) */}
        <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900/70">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Signals over time</span>
            <span>Mock trend (last 8 weeks)</span>
          </div>
          <div className="h-40 w-full">
            <svg viewBox="0 0 320 160" className="h-full w-full">
              <defs>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* grid lines */}
              <g strokeWidth="0.5" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700">
                <line x1="0" y1="20" x2="320" y2="20" />
                <line x1="0" y1="60" x2="320" y2="60" />
                <line x1="0" y1="100" x2="320" y2="100" />
                <line x1="0" y1="140" x2="320" y2="140" />
              </g>
              {/* area under line */}
              <path
                d="M10 120 C 50 80, 90 60, 130 70 C 170 80, 210 40, 250 50 C 290 60, 310 90, 310 120 L 310 160 L 10 160 Z"
                fill="url(#line-gradient)"
              />
              {/* line */}
              <path
                d="M10 120 C 50 80, 90 60, 130 70 C 170 80, 210 40, 250 50 C 290 60, 310 90, 310 120"
                fill="none"
                strokeWidth="2.5"
                className="stroke-violet-500 dark:stroke-violet-400"
              />
              {/* points */}
              <g className="fill-white stroke-violet-500 dark:stroke-violet-400">
                <circle cx="10" cy="120" r="3" />
                <circle cx="70" cy="70" r="3" />
                <circle cx="130" cy="70" r="3" />
                <circle cx="190" cy="60" r="3" />
                <circle cx="250" cy="50" r="3" />
                <circle cx="310" cy="90" r="3" />
              </g>
            </svg>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Trendline illustrates how total signals might move week over week. Real data will be plotted here once
            scan history is available.
          </p>
        </div>

        <div className="mt-8">
          <EmptyState
            title="No real insight data yet"
            description="Once scans have been running for a while, this view will show real cross-competitor distributions, trends, and recommended actions."
          />
        </div>
      </section>
    </div>
  );
}

