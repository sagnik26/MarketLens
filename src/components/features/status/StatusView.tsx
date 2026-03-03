/** Client Status view: Live Runs (with iframe) and Recent Runs tabs. */

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useScanProgressStore } from "@/stores/scan-progress.store";
import type { AgentStatus, ScanRun } from "@/types";
import { cn } from "@/lib/utils";

interface StatusViewProps {
  agents: AgentStatus[];
  recentRuns: ScanRun[];
}

type StatusTab = "live" | "recent";

export function StatusView({ agents, recentRuns }: StatusViewProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("live");
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const scans = useScanProgressStore((s) => s.scans);
  const runningScans = useMemo(
    () => scans.filter((sc) => sc.status === "running"),
    [scans],
  );
  const selectedScan = useMemo(
    () => (selectedScanId ? runningScans.find((s) => s.id === selectedScanId) : null),
    [selectedScanId, runningScans],
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Status sections"
        className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 dark:border-neutral-700 dark:bg-neutral-800/50"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "live"}
          aria-controls="live-runs-panel"
          id="live-runs-tab"
          onClick={() => setActiveTab("live")}
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm font-medium transition",
            activeTab === "live"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-neutral-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          Live Runs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "recent"}
          aria-controls="recent-runs-panel"
          id="recent-runs-tab"
          onClick={() => setActiveTab("recent")}
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm font-medium transition",
            activeTab === "recent"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-neutral-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          Recent Runs
        </button>
      </div>

      {/* Live Runs panel */}
      <div
        id="live-runs-panel"
        role="tabpanel"
        aria-labelledby="live-runs-tab"
        hidden={activeTab !== "live"}
        className="space-y-4"
      >
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Running agents
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select an agent to view its live browser stream (when available).
          </p>

          {runningScans.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No live runs
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Start a scan from Competitor Radar to see live agents here.
              </p>
              <Link
                href="/dashboard/actions/competitor-radar"
                className="mt-4 inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-violet-500"
              >
                Go to Competitor Radar →
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4 lg:flex-row">
              <div className="flex shrink-0 flex-col gap-2 lg:w-72">
                {runningScans.map((scan) => (
                  <button
                    key={scan.id}
                    type="button"
                    onClick={() =>
                      setSelectedScanId(selectedScanId === scan.id ? null : scan.id)
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                      selectedScanId === scan.id
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/30 dark:border-violet-600 dark:bg-violet-950/40 dark:ring-violet-500/20"
                        : "border-neutral-200 bg-white hover:border-violet-200 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:hover:border-violet-800 dark:hover:bg-neutral-800"
                    )}
                  >
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
                        {scan.events.length > 0 && ` · ${scan.events.length} events`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="min-h-[320px] flex-1 rounded-xl border border-neutral-200 bg-neutral-100/50 dark:border-neutral-700 dark:bg-neutral-900/50">
                {selectedScan ? (
                  selectedScan.streamingUrl ? (
                    <iframe
                      title={`Live stream: ${selectedScan.competitorName}`}
                      src={selectedScan.streamingUrl}
                      className="h-full min-h-[320px] w-full rounded-xl border-0"
                      allow="fullscreen"
                    />
                  ) : (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl bg-neutral-800 p-6 text-center">
                      <p className="text-sm font-medium text-white">
                        {selectedScan.competitorName}
                      </p>
                      <p className="mt-1 text-xs text-white/80">
                        Live browser stream is available when the scan is started
                        via streaming. Progress events are shown in the card.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl bg-neutral-800 p-6 text-center text-sm text-white/80">
                    Select a running agent to view its stream
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Runs panel */}
      <div
        id="recent-runs-panel"
        role="tabpanel"
        aria-labelledby="recent-runs-tab"
        hidden={activeTab !== "recent"}
        className="space-y-4"
      >
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recent runs
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            History of completed scan runs.
          </p>

          {recentRuns.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              No recent runs yet. Once scans complete, they will appear here.
            </p>
          ) : (
            <ul className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                      {run.totalCompetitors} competitors · {run.totalSignals}{" "}
                      signals · {run.totalInsights} insights
                    </span>
                  </div>
                  <span className="text-xs font-medium capitalize text-emerald-600 dark:text-emerald-400">
                    {run.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
