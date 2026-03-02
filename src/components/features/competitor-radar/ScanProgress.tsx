/** Live SSE scan progress feed with Aceternity-style card. */

import { cn } from "@/lib/utils";

interface ScanProgressProps {
  runId: string;
  status: string;
  events: string[];
  competitorName?: string;
  onCancel: () => void;
  onComplete: () => void;
}

export function ScanProgress({
  runId,
  status,
  events,
  competitorName,
  onCancel,
  onComplete,
}: ScanProgressProps) {
  const isRunning = status === "running";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80",
        "ring-1 ring-neutral-200/50 dark:ring-neutral-800/50"
      )}
      aria-live="polite"
      aria-label="Scan progress"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
              isRunning ? "animate-pulse bg-amber-500" : "bg-emerald-500"
            )}
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {competitorName ? `Scan: ${competitorName}` : "Scan in progress"}
          </h2>
        </div>
        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            Done
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {isRunning ? "Running…" : "Completed"}
      </p>
      {events.length > 0 && (
        <ul className="mt-4 max-h-36 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/50 py-3 pl-6 pr-3 text-xs text-zinc-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-zinc-400">
          {events.map((evt, i) => (
            <li key={i} className="list-disc pl-1">
              {evt}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
