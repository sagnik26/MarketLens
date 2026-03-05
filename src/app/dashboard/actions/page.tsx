/** Actions index: Competitor Radar entry point. */

import Link from "next/link";

export default function ActionsPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Actions
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Actions
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Run competitor scans from a single place.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="sr-only">
          Actions
        </h2>
        <Link
          href="/dashboard/actions/product-matchups"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-800"
        >
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
            Product Matchups
          </span>
          <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Define one of your products, pick a competitor, and set a goal for the matchup.
          </span>
          <span className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400">Open →</span>
        </Link>

        <Link
          href="/dashboard/actions/competitor-radar"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-800"
        >
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
            Competitor Radar
          </span>
          <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Add competitors and run scans. Select one or multiple to run batch scans.
          </span>
          <span className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400">Open →</span>
        </Link>

        <Link
          href="/dashboard/actions/compliance"
          className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-800"
        >
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
            Compliance and alerts
          </span>
          <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Regulatory circulars and compliance alerts for your industry.
          </span>
          <span className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400">Open →</span>
        </Link>
      </section>
    </div>
  );
}
