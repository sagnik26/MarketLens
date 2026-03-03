/** Information page: sections for Competitor Radar and Compliance Radar, backed by backend summary. */

import { Suspense } from "react";
import Link from "next/link";
import { EmptyState, DashboardShimmer } from "@/components/common";
import { informationService } from "@/server/services/information.service";

export const dynamic = "force-dynamic";

async function InformationContent() {
  const summary = await informationService.getSummary();

  return (
    <>
      <div className="space-y-8">
        {/* Competitor Radar section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Competitor Radar</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Consolidated profile information from pricing, jobs, Product Hunt, and features.
                Data reflects your current competitors; refresh to see newly added ones. Scan results will appear once runs are stored.
              </p>
            </div>
          </header>

          <div className="mt-5">
            {summary.competitorRadar.channels.length === 0 ? (
              <EmptyState
                title="No signals yet"
                description="Once your scans detect signals for pricing, jobs, Product Hunt, or features, they will appear here grouped by channel."
                actionHref="/dashboard/actions/competitor-radar"
                actionLabel="Go to Competitor Radar"
              />
            ) : (
              <div className="space-y-4">
                {summary.competitorRadar.channels.map((group) => {
                  if (group.profiles.length === 0) return null;

                  return (
                    <article
                      key={group.channel}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {group.label}
                        </h3>
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          {group.profiles.length} competitors
                        </span>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                        {group.profiles.map((item) => (
                          <li key={`${item.competitorId}-${group.channel}`}>
                            <Link
                              href={`/dashboard/information/${group.channel}?competitorId=${encodeURIComponent(item.competitorId)}`}
                              className="block rounded-lg px-2 py-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                            >
                              <span className="font-medium">{item.name}</span>
                              <span className="mx-1 text-zinc-400">·</span>
                              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                {item.segment}
                              </span>
                              <p className="mt-1 text-[13px] text-zinc-700 dark:text-zinc-200">{item.focus}</p>
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Last scan: {item.lastScan}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Compliance Radar section */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Compliance Radar</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Summaries of BSE/NSE circulars and other regulatory notices relevant to your product.
              </p>
            </div>
          </header>

          <div className="mt-5">
            <EmptyState
              title="No compliance summaries yet"
              description="Compliance Radar will surface short briefings for each relevant circular, with links back to the original BSE/NSE notice. This section will populate once compliance scans are enabled."
              actionHref="/dashboard/actions/compliance"
              actionLabel="Open Compliance Radar"
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default function InformationPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Information
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Information
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Detailed information for each radar: competitor signals by channel, plus compliance summaries.
        </p>
      </header>

      <Suspense fallback={<DashboardShimmer />}>
        <InformationContent />
      </Suspense>
    </div>
  );
}
