/** Client Status view: in-progress scans from store + server agents/recent runs. */

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useScanProgressStore } from "@/stores/scan-progress.store";
import { StatusInProgressCard } from "./StatusInProgressCard";
import type { AgentStatus, ScanRun } from "@/types";

interface StatusViewProps {
  agents: AgentStatus[];
  recentRuns: ScanRun[];
}

export function StatusView({ agents, recentRuns }: StatusViewProps) {
  const scans = useScanProgressStore((s) => s.scans);
  const runningScans = useMemo(
    () => scans.filter((sc) => sc.status === "running"),
    [scans],
  );
  const hasRunningAgent = agents.some((agent) => agent.currentRun);
  const hasBackendRunInProgress = recentRuns.some(
    (run) => run.status === "running" || run.status === "queued",
  );
  const hasAnyActiveWork =
    hasRunningAgent || runningScans.length > 0 || hasBackendRunInProgress;

  return (
    <div className="space-y-8">
      {runningScans.length > 0 && (
        <section aria-labelledby="in-progress-heading">
          <h2
            id="in-progress-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Scans in progress
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Live status for scans started from Competitor Radar. Multiple runs
            can proceed in parallel.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runningScans.map((scan) => (
              <StatusInProgressCard key={scan.id} scan={scan} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Agents
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Live agent status and recent run history.
        </p>

        {agents.length === 0 && recentRuns.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No agent activity recorded yet. Once scans are running, their status
            and history will appear here.
          </p>
        ) : (
          <>
            {!hasAnyActiveWork ? (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-zinc-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-zinc-300">
                <div className="mr-4">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    No agents are currently running.
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Start a new scan from Actions to see live progress here.
                  </p>
                </div>
                <Link
                  href="/dashboard/actions"
                  className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-violet-500"
                >
                  Go to Actions →
                </Link>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="mr-4">
                  <p className="font-medium">Agents are running.</p>
                  <p className="text-xs opacity-80">
                    {runningScans.length > 0
                      ? `Tracking ${runningScans.length} live scan${
                          runningScans.length === 1 ? "" : "s"
                        } in progress.`
                      : "A scan is currently being processed. Live progress will appear above when available."}
                  </p>
                </div>
              </div>
            )}

            {recentRuns.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Recent runs
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {recentRuns.map((run) => (
                    <li
                      key={run.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/60"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">
                          {run.goalName.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {run.totalCompetitors} competitors ·{" "}
                          {run.totalSignals} signals · {run.totalInsights}{" "}
                          insights
                        </span>
                      </div>
                      <span className="text-xs font-medium capitalize text-emerald-600 dark:text-emerald-400">
                        {run.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
