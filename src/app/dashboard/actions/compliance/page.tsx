/** Compliance Radar page: placeholder while the feature is being built. */

export default function CompliancePage() {

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
          Compliance Radar
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Compliance Radar
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">Track key regulatory circulars in one place.</p>
      </header>

      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-6 text-sm text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50">
        <h2 className="text-base font-semibold">Compliance Radar is coming soon</h2>
        <p className="mt-2 text-xs md:text-sm">
          We’re building a dedicated Compliance Radar to surface BSE/NSE circulars and regulatory notices that impact
          your product. This module will be available in an upcoming release.
        </p>
      </div>
    </div>
  );
}

