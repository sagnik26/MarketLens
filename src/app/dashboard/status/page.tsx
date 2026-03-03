/** Status page: shows in-progress scans (client store) and agents/recent runs (server). */

import { Suspense } from "react";
import { getStatusSummaryAction } from "@/actions/status.actions";
import { StatusView } from "@/components/features/status/StatusView";
import { DashboardShimmer } from "@/components/common";

async function StatusContent() {
  const result = await getStatusSummaryAction();
  const agents = result.success && result.data ? result.data.agents : [];
  const recentRuns =
    result.success && result.data ? result.data.recentRuns : [];

  return (
    <>
      {!result.success && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          Unable to load status summary.
        </p>
      )}

      <StatusView agents={agents} recentRuns={recentRuns} />
    </>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span
            className="h-1.5 w-1.5 rounded-full bg-violet-500"
            aria-hidden
          />
          Status
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Status
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          View the status of currently working agents and past scan jobs.
        </p>
      </header>

      <Suspense fallback={<DashboardShimmer />}>
        <StatusContent />
      </Suspense>
    </div>
  );
}
