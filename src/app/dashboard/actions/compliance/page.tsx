/** Compliance Radar page: BSE/NSE circulars placeholder with shared empty state. */

import { EmptyState } from "@/components/common";

export default function CompliancePage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Compliance Radar
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Compliance Radar
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          BSE and NSE circulars and regulatory notices in one place.
        </p>
      </header>

      <EmptyState
        title="No compliance data yet"
        description="BSE and NSE circulars will appear here once the compliance integration is wired up. For now, use Competitor Radar and Information to explore the rest of the product."
        actionHref="/dashboard/actions"
        actionLabel="Back to Actions"
      />
    </div>
  );
}

