/** Compliance and alerts: placeholder while the feature is being built. */

export default function CompliancePage() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Compliance and alerts
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Compliance and alerts
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Regulatory circulars and compliance alerts for your industry.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-8 text-center shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50">
        <h2 className="text-lg font-semibold">Work in progress</h2>
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
          This module is under development and will be coming soon. You’ll be able to track regulatory circulars (e.g.
          BSE/NSE) and compliance alerts here.
        </p>
      </section>
    </div>
  );
}

