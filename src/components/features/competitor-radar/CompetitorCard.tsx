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
}

export function CompetitorCard({
  competitor,
  onRunScan,
  isScanning = false,
  showCheckbox = false,
  selected = false,
  onToggleSelect,
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
        <div className="mt-4">
          <button
            type="button"
            onClick={onRunScan}
            disabled={isScanning}
            className={cn(
              "w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              "bg-zinc-900 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            )}
          >
            {isScanning ? "Scanning…" : "Run scan"}
          </button>
        </div>
      </div>
    </article>
  );
}
