/** List of detected changes for a competitor or scan with filters and read/dismiss state. */

import { cn } from "@/lib/utils";
import type { Change } from "./competitor-radar.types";
import { Priority } from "@/constants";

const PRIORITY_STYLES: Record<string, string> = {
  [Priority.URGENT]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [Priority.HIGH]: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [Priority.MEDIUM]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [Priority.LOW]: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
};

interface ChangesFeedProps {
  changes: Change[];
  onCreateAction: (changeId: string) => void;
}

export function ChangesFeed({ changes, onCreateAction }: ChangesFeedProps) {
  if (changes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        No changes yet. Run a scan on a competitor to detect changes.
      </p>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {changes.map((change) => (
        <li
          key={change.id}
          className={cn(
            "rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-violet-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800",
            !change.isRead && "border-l-4 border-l-violet-500 dark:border-l-violet-400"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{change.title}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {change.competitorName} · {change.changeType}
              </p>
              {change.summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{change.summary}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                    PRIORITY_STYLES[change.priority] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {change.priority}
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {change.signalType}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCreateAction(change.id)}
              className="shrink-0 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20"
            >
              Create task
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
