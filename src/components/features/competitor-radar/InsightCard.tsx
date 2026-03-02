/** AI-generated PM briefing card with Aceternity-style hover and priority styling. */

import { cn } from "@/lib/utils";
import type { Insight } from "./competitor-radar.types";
import { Priority } from "@/constants";

const PRIORITY_STYLES: Record<string, string> = {
  [Priority.URGENT]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  [Priority.HIGH]: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  [Priority.MEDIUM]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [Priority.LOW]: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
};

interface InsightCardProps {
  insight: Insight;
  onCreateAction: () => void;
}

export function InsightCard({ insight, onCreateAction }: InsightCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 transition duration-300 dark:border-neutral-800 dark:bg-neutral-900",
        "hover:border-violet-200 hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.25)] dark:hover:border-violet-800 dark:hover:shadow-[0_0_25px_-8px_rgba(139,92,246,0.2)]"
      )}
      aria-labelledby={`insight-title-${insight.id}`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative">
        <h3
          id={`insight-title-${insight.id}`}
          className="font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {insight.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{insight.competitorName}</p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{insight.briefing}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              PRIORITY_STYLES[insight.priority] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
            )}
          >
            {insight.priority}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {insight.signalType}
          </span>
        </div>
        {insight.recommendedActions.length > 0 && (
          <ul className="mt-3 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-300">
            {insight.recommendedActions.slice(0, 3).map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <button
            type="button"
            onClick={onCreateAction}
            className={cn(
              "rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:bg-transparent dark:text-violet-400 dark:hover:bg-violet-900/20"
            )}
          >
            Create task from insight
          </button>
        </div>
      </div>
    </article>
  );
}
