/** Dashboard Overview: competitor cards, scan progress, changes feed, and insights. */

import { CompetitorRadarView } from "@/components/features/competitor-radar/CompetitorRadarView";

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
          Monitor competitors, recent changes, and insights. Run scans from Competitor Radar.
        </p>
      </header>

      <CompetitorRadarView />
    </div>
  );
}
