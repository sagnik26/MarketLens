/** Reusable empty-state card with icon, title, description, and optional action. */

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/50 dark:to-violet-800/50"
        aria-hidden
      >
        <svg
          className="h-8 w-8 text-violet-600 dark:text-violet-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 6h.008v.008H12V18z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}

