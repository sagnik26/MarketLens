/** Compliance Radar page: surfaces BSE/NSE circulars summary via TinyFish-backed scan service. */

import { EmptyState } from "@/components/common";
import { getComplianceSummaryAction } from "@/actions/compliance.actions";

export default async function CompliancePage() {
  const result = await getComplianceSummaryAction();
  const summary = result.success && result.data ? result.data : null;

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

      {!summary ? (
        <EmptyState
          title="Unable to load compliance data"
          description="The compliance summary could not be loaded. Please try again in a few moments."
          actionHref="/dashboard/actions"
          actionLabel="Back to Actions"
        />
      ) : (
        <section className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Latest run</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Latest TinyFish-backed run status for fetching recent BSE/NSE circulars.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/60">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {summary.lastRun?.goalName.replace(/_/g, " ") ?? "No runs yet"}
                </p>
                {summary.lastRun && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Status: <span className="font-medium capitalize">{summary.lastRun.status}</span>
                  </p>
                )}
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Prototype
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Circulars & insights</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Once compliance scans return structured data, this section will list recent circulars, briefings, and
              recommended actions.
            </p>

            <div className="mt-4">
              <EmptyState
                title="No compliance circulars parsed yet"
                description="Compliance Radar is wired to the TinyFish-backed scan service. When enabled with real parsing and storage, you will see circulars and insights here."
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

