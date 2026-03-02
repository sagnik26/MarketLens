/** Status page: currently working agents status. */

export default function StatusPage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Status
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Status
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          View the status of currently working agents and scan jobs.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agents</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Agent status and run history will appear here. Integration coming soon.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Scan agent</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Idle</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Insight agent</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Idle</span>
          </div>
        </div>
      </section>
    </div>
  );
}
