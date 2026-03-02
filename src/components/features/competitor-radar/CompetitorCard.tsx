/** Card displaying a single competitor (name, website, logo) and quick actions with Aceternity hover. */

import { cn } from "@/lib/utils";
import type { Competitor } from "./competitor-radar.types";

interface CompetitorCardProps {
  competitor: Competitor;
  onRunScan: () => void;
  isScanning?: boolean;
  /** When true, show a checkbox for multi-select (e.g. run multiple scans). */
  showCheckbox?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** When provided, show a delete control that calls this (caller should confirm). */
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function CompetitorCard({
  competitor,
  onRunScan,
  isScanning = false,
  showCheckbox = false,
  selected = false,
  onToggleSelect,
  onDelete,
  isDeleting = false,
}: CompetitorCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 transition duration-300 dark:border-neutral-800 dark:bg-neutral-900",
        "hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:hover:border-violet-800 dark:hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.2)]",
        "focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-neutral-950"
      )}
      aria-labelledby={`competitor-name-${competitor.id}`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">
        {showCheckbox && onToggleSelect && (
          <label className="mb-3 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500 dark:border-neutral-600 dark:bg-neutral-800"
            />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Select for batch scan</span>
          </label>
        )}
        <div className="flex items-start gap-3">
          {competitor.logoUrl ? (
            <img
              src={competitor.logoUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-lg object-contain ring-1 ring-neutral-200 dark:ring-neutral-700"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 text-sm font-semibold text-violet-700 dark:from-violet-900/50 dark:to-violet-800/50 dark:text-violet-300"
              aria-hidden
            >
              {competitor.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              id={`competitor-name-${competitor.id}`}
              className="truncate font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {competitor.name}
            </h3>
            <a
              href={competitor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-sm text-zinc-500 underline decoration-zinc-300 hover:decoration-violet-400 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:decoration-violet-500"
            >
              {competitor.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRunScan}
            disabled={isScanning || isDeleting}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              "bg-zinc-900 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            )}
          >
            {isScanning ? "Scanning…" : "Run scan"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isScanning || isDeleting}
              className={cn(
                "shrink-0 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:border-red-900 dark:hover:text-red-400",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
              )}
              aria-label={`Delete ${competitor.name}`}
              title="Delete competitor"
            >
              {isDeleting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
