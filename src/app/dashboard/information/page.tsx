/** Information page: detail info specific to each competitor. */

import Link from "next/link";
import { EmptyState } from "@/components/common";

const SAMPLE_COMPETITORS = [
  {
    name: "Acme Corp",
    segment: "SME invoicing",
    focus: "Aggressive pricing discounts and bundle offers",
    lastScan: "Today · 09:12",
  },
  {
    name: "Beta Inc",
    segment: "Enterprise billing",
    focus: "New AI-assisted reconciliation features",
    lastScan: "Yesterday · 18:47",
  },
  {
    name: "Gamma LLC",
    segment: "SMB POS",
    focus: "Hiring heavily for partnerships and GTM",
    lastScan: "2 days ago · 14:05",
  },
];

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
          Detailed information for each competitor: pricing, jobs, features, and history.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sample competitors</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          This is a mocked view to illustrate how competitor profiles will look once data is connected.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SAMPLE_COMPETITORS.map((c) => (
            <article
              key={c.name}
              className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900/60"
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {c.segment}
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Primary focus</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">{c.focus}</p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Last scan: {c.lastScan}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <EmptyState
            title="No live competitor selected"
            description="Once you run scans in Competitor Radar and select a competitor, their full profile will appear here with pricing, jobs, features, and history."
            actionHref="/dashboard/actions/competitor-radar"
            actionLabel="Go to Competitor Radar"
          />
        </div>
      </section>
    </div>
  );
}

