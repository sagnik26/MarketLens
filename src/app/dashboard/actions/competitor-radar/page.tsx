/** Competitor Radar page: add competitor, list available competitors, run one or multiple scans. */

import { CompetitorManageView } from "@/components/features/competitor-radar/CompetitorManageView";

export default function CompetitorRadarPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Competitor Radar
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Competitor Radar
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Add competitors and run scans across pricing, jobs, Product Hunt, and feature pages whenever you&apos;re ready.
        </p>
      </header>

      <CompetitorManageView />
    </div>
  );
}
