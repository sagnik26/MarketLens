/** Compliance manage view: sources, manual scan, schedules (alerts required), recent runs. */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  getComplianceSourcesAction,
  addComplianceSourceAction,
  deleteComplianceSourceAction,
  runComplianceScanAction,
  getComplianceRecentRunsAction,
  getComplianceSchedulesAction,
  createComplianceScheduleAction,
  updateComplianceScheduleAction,
  deleteComplianceScheduleAction,
} from "@/actions/compliance.actions";
import type { ComplianceSourceResponse, ComplianceScheduleResponse } from "@/types/compliance.types";
import type { ScanRun } from "@/types";
import { DashboardShimmer } from "@/components/common";
import { complianceKeys } from "@/lib/queryKeys";

const AUTH_ERROR_PATTERN = /unauthorized|access token|session|expired/i;

function isAuthError(message: string): boolean {
  return AUTH_ERROR_PATTERN.test(message);
}

export function ComplianceManageView() {
  const [authError, setAuthError] = useState<Error | null>(null);
  const [sources, setSources] = useState<ComplianceSourceResponse[]>([]);
  const [recentRuns, setRecentRuns] = useState<ScanRun[]>([]);
  const [schedules, setSchedules] = useState<ComplianceScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanningSourceId, setScanningSourceId] = useState<string | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSourceId, setScheduleSourceId] = useState("");
  const [scheduleCron, setScheduleCron] = useState("0 9 * * 1-5");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState<string | null>(null);
  const [scheduleToggleError, setScheduleToggleError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(null);
    try {
      const [sourcesRes, runsRes, schedulesRes] = await Promise.all([
        getComplianceSourcesAction(),
        getComplianceRecentRunsAction(),
        getComplianceSchedulesAction(),
      ]);
      if (!sourcesRes.success && sourcesRes.error && isAuthError(sourcesRes.error)) {
        setAuthError(new Error(sourcesRes.error));
        return { sourcesRes, runsRes, schedulesRes };
      }
      if (!runsRes.success && runsRes.error && isAuthError(runsRes.error)) {
        setAuthError(new Error(runsRes.error));
        return { sourcesRes, runsRes, schedulesRes };
      }
      if (!schedulesRes.success && schedulesRes.error && isAuthError(schedulesRes.error)) {
        setAuthError(new Error(schedulesRes.error));
        return { sourcesRes, runsRes, schedulesRes };
      }
      if (sourcesRes.success && sourcesRes.data) setSources(sourcesRes.data);
      else if (!sourcesRes.success) setError(sourcesRes.error ?? "Failed to load sources");
      if (runsRes.success && runsRes.data) setRecentRuns(runsRes.data);
      if (schedulesRes.success && schedulesRes.data) setSchedules(schedulesRes.data);
      return { sourcesRes, runsRes, schedulesRes };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (isAuthError(message)) {
        setAuthError(e instanceof Error ? e : new Error(message));
      } else {
        setError(message);
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const complianceQuery = useQuery({
    queryKey: complianceKeys.list(),
    queryFn: load,
    staleTime: 2 * 60 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    setLoading(complianceQuery.isPending && !complianceQuery.data);
    if (complianceQuery.error) {
      setError(complianceQuery.error instanceof Error ? complianceQuery.error.message : "Failed to load");
      return;
    }
    const { sourcesRes, runsRes, schedulesRes } = complianceQuery.data ?? {};
    if (!complianceQuery.data) return;
    setError(null);
    setAuthError(null);
    if (sourcesRes?.success && sourcesRes.data) setSources(sourcesRes.data);
    else if (sourcesRes && !sourcesRes.success) setError(sourcesRes.error ?? "Failed to load sources");
    if (runsRes?.success && runsRes.data) setRecentRuns(runsRes.data);
    if (schedulesRes?.success && schedulesRes.data) setSchedules(schedulesRes.data);
  }, [
    complianceQuery.isPending,
    complianceQuery.data,
    complianceQuery.error,
    setLoading,
    setError,
  ]);

  const handleAddSource = useCallback(async () => {
    const name = addName.trim();
    const url = addUrl.trim();
    if (!name || !url) {
      setAddFormError("Name and URL are required.");
      return;
    }
    setAddFormError(null);
    setAddSubmitting(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("url", url);
    const result = await addComplianceSourceAction(formData);
    setAddSubmitting(false);
    if (result.success && result.data) {
      setSources((prev) => [result.data!, ...prev]);
      setAddModalOpen(false);
      setAddName("");
      setAddUrl("");
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    } else {
      setAddFormError(result.error ?? "Failed to add source.");
    }
  }, [addName, addUrl, queryClient]);

  const handleDeleteSource = useCallback(async (source: ComplianceSourceResponse) => {
    if (!window.confirm(`Remove "${source.name}"?`)) return;
    setDeletingSourceId(source.id);
    setError(null);
    const result = await deleteComplianceSourceAction(source.id);
    setDeletingSourceId(null);
    if (result.success) {
      setSources((prev) => prev.filter((s) => s.id !== source.id));
      setSchedules((prev) => prev.filter((s) => s.complianceSourceId !== source.id));
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    } else {
      setError(result.error ?? "Failed to delete source.");
    }
  }, [queryClient]);

  const handleRunScan = useCallback(async (sourceId: string) => {
    setScanningSourceId(sourceId);
    setError(null);
    const result = await runComplianceScanAction(sourceId);
    setScanningSourceId(null);
    if (result.success) {
      setRecentRuns((prev) => [result.data!.scanRun, ...prev]);
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    } else {
      setError(result.error ?? "Scan failed.");
    }
  }, [queryClient]);

  const handleAddSchedule = useCallback(async () => {
    if (!scheduleSourceId.trim()) {
      setScheduleFormError("Select a source.");
      return;
    }
    setScheduleFormError(null);
    setScheduleSubmitting(true);
    const result = await createComplianceScheduleAction({
      complianceSourceId: scheduleSourceId,
      cronExpression: scheduleCron.trim(),
      isEnabled: false,
    });
    setScheduleSubmitting(false);
    if (result.success && result.data) {
      setSchedules((prev) => [result.data!, ...prev]);
      setScheduleModalOpen(false);
      setScheduleSourceId("");
      setScheduleCron("0 9 * * 1-5");
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    } else {
      setScheduleFormError(result.error ?? "Failed to create schedule.");
    }
  }, [scheduleSourceId, scheduleCron, queryClient]);

  const handleToggleSchedule = useCallback(
    async (schedule: ComplianceScheduleResponse, nextEnabled: boolean) => {
      setScheduleToggleError(null);
      const result = await updateComplianceScheduleAction(schedule.id, { isEnabled: nextEnabled });
      if (result.success && result.data) {
        setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? result.data! : s)));
        queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      } else {
        setScheduleToggleError(result.error ?? "Failed to update schedule.");
      }
    },
    [queryClient],
  );

  const handleDeleteSchedule = useCallback(async (scheduleId: string) => {
    if (!window.confirm("Remove this schedule?")) return;
    const result = await deleteComplianceScheduleAction(scheduleId);
    if (result.success) {
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    } else {
      setScheduleToggleError(result.error ?? "Failed to delete schedule.");
    }
  }, [queryClient]);

  const sourceNameById = useCallback(
    (id: string) => sources.find((s) => s.id === id)?.name ?? id,
    [sources],
  );

  if (authError) {
    throw authError;
  }

  if (loading && sources.length === 0 && recentRuns.length === 0) {
    return (
      <div className="min-h-[40vh]">
        <DashboardShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Compliance sources */}
      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Compliance sources</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Add regulatory sources (e.g. BSE/NSE circular pages). Run manual scans or set up scheduled scans below.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAddFormError(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add source
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <article
              key={source.id}
              className={cn(
                "flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
                "hover:border-violet-200 dark:hover:border-violet-800",
              )}
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{source.name}</h3>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 truncate text-sm text-zinc-500 underline dark:text-zinc-400"
              >
                {source.url.replace(/^https?:\/\//, "")}
              </a>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRunScan(source.id)}
                  disabled={!!scanningSourceId || !!deletingSourceId}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium",
                    "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
                  )}
                >
                  {scanningSourceId === source.id ? "Scanning…" : "Run scan"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSource(source)}
                  disabled={!!deletingSourceId}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-zinc-300 dark:hover:bg-neutral-800"
                >
                  {deletingSourceId === source.id ? "…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
        {sources.length === 0 && !loading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No sources yet. Add one to run compliance scans.</p>
        )}
      </section>

      {/* Add source modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-source-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <h2 id="add-source-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Add compliance source
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Name (e.g. BSE Circulars) and URL of the regulatory page to monitor.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. BSE Circulars"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                URL
                <input
                  type="url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://www.bseindia.com/..."
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                />
              </label>
            </div>
            {addFormError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {addFormError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setAddFormError(null);
                }}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-600 dark:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSource}
                disabled={addSubmitting}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {addSubmitting ? "Adding…" : "Add source"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled scans & alerts */}
      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Scheduled scans & alerts</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              {sources.length === 0
                ? "Add at least one compliance source above to enable Add schedule."
                : "Add a schedule to run compliance scans on a cron. Turn Enabled on to run it automatically."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setScheduleFormError(null);
              setScheduleModalOpen(true);
            }}
            disabled={sources.length === 0}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add schedule
          </button>
        </div>
        {scheduleToggleError && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="alert">
            {scheduleToggleError}
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/50"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {sourceNameById(schedule.complianceSourceId)} — <span className="font-mono text-xs">{schedule.cronExpression}</span>
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={schedule.isEnabled}
                    onChange={(e) => handleToggleSchedule(schedule, e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-violet-600 dark:border-neutral-600"
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-zinc-400 dark:hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {schedules.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No schedules. Add a source first, then add a schedule.</p>
        )}
      </section>

      {/* Add schedule modal */}
      {scheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-schedule-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <h2 id="add-schedule-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Add schedule
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cron expression (e.g. 0 9 * * 1-5 = weekdays 9:00).
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Source
                <select
                  value={scheduleSourceId}
                  onChange={(e) => setScheduleSourceId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                >
                  <option value="">Select source</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Cron expression
                <input
                  type="text"
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  placeholder="0 9 * * 1-5"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-zinc-100"
                />
              </label>
            </div>
            {scheduleFormError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {scheduleFormError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleModalOpen(false);
                  setScheduleFormError(null);
                }}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-600 dark:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSchedule}
                disabled={scheduleSubmitting}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {scheduleSubmitting ? "Adding…" : "Add schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent compliance runs */}
      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Recent compliance runs</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Latest compliance scans. Alerts fire via Integrations when a run completes (Scan completed trigger).
        </p>
        <ul className="mt-4 space-y-2">
          {recentRuns.slice(0, 10).map((run) => (
            <li
              key={run.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-700"
            >
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {run.startedAt ? new Date(run.startedAt).toLocaleString() : run.id}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  run.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
                  run.status === "failed" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
                  run.status === "running" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                )}
              >
                {run.status}
              </span>
            </li>
          ))}
        </ul>
        {recentRuns.length === 0 && !loading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No compliance runs yet. Run a scan from a source above.</p>
        )}
      </section>
    </div>
  );
}
