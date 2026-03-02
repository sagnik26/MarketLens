/** Single in-progress scan card with gradient border animation and event stream. */

"use client";

import { cn } from "@/lib/utils";
import type { ScanProgressEntry } from "@/stores/scan-progress.store";

interface StatusInProgressCardProps {
  scan: ScanProgressEntry;
  className?: string;
}

export function StatusInProgressCard({ scan, className }: StatusInProgressCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-gradient-to-r from-violet-500 via-amber-400 to-emerald-500 bg-[length:200%_200%] p-[2px] animate-[status-border-shimmer_4s_ease-in-out_infinite]",
        className
      )}
      aria-live="polite"
      aria-label={`Scan in progress: ${scan.competitorName}`}
    >
      <div className="rounded-[10px] bg-white p-4 shadow-sm dark:bg-neutral-900/95 animate-[status-pulse_2s_ease-in-out_infinite]">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 dark:border-violet-600 dark:border-t-violet-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {scan.competitorName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Started {new Date(scan.startedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
      {scan.events.length > 0 && (
        <ul className="mt-3 max-h-24 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/80 py-3 pl-6 pr-3 text-xs text-zinc-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-zinc-400">
          {scan.events.map((evt, i) => (
            <li key={i} className="list-disc pl-1">
              {evt}
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}
