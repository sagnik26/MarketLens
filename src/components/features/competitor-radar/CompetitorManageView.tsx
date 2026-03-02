/** Competitor Radar manage view: add competitor, list competitors, run one or multiple scans. */

"use client";

import { useState, useCallback, useEffect } from "react";
import { CompetitorCard } from "./CompetitorCard";
import { ScanProgress } from "./ScanProgress";
import { getCompetitorsAction, addCompetitorsAction } from "@/actions/competitor.actions";
import { useCompetitorRadarState } from "./useCompetitorRadarState";
import type { Competitor } from "./competitor-radar.types";

export function CompetitorManageView() {
  const {
    competitors,
    setCompetitors,
    activeScanRunId,
    setActiveScanRunId,
    scanStatus,
    setScanStatus,
    scanEvents,
    setScanEvents,
    loading,
    setLoading,
    error,
    setError,
  } = useCompetitorRadarState();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formRows, setFormRows] = useState<{ name: string; url: string }[]>([{ name: "", url: "" }]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getCompetitorsAction();
    setLoading(false);
    if (result.success && result.data) setCompetitors(result.data as Competitor[]);
    else setError(result.error ?? "Failed to load competitors");
  }, [setCompetitors, setLoading, setError]);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRunScan = useCallback(
    (competitorId: string) => {
      setActiveScanRunId(competitorId);
      setScanStatus("running");
      setScanEvents([]);
    },
    [setActiveScanRunId, setScanStatus, setScanEvents]
  );

  const handleScanComplete = useCallback(() => {
    setActiveScanRunId(null);
    setScanStatus(null);
    loadCompetitors();
  }, [setActiveScanRunId, setScanStatus, loadCompetitors]);

  useEffect(() => {
    if (!activeScanRunId || scanStatus !== "running") return;
    const t = setTimeout(() => {
      setScanEvents((e) => [...e, "Navigating to page", "Extracting data", "Complete"]);
      setScanStatus("completed");
    }, 2500);
    return () => clearTimeout(t);
  }, [activeScanRunId, scanStatus, setScanEvents, setScanStatus]);

  const openAddModal = useCallback(() => {
    setFormRows([{ name: "", url: "" }]);
    setFormError(null);
    setAddModalOpen(true);
  }, []);

  const addFormRow = useCallback(() => {
    setFormRows((prev) => [...prev, { name: "", url: "" }]);
  }, []);

  const updateFormRow = useCallback((index: number, field: "name" | "url", value: string) => {
    setFormRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleAddSubmit = useCallback(async () => {
    const valid = formRows.filter((r) => r.name.trim() && r.url.trim());
    if (valid.length === 0) {
      setFormError("Add at least one competitor with name and URL.");
      return;
    }
    setFormError(null);
    setSubmitLoading(true);
    const result = await addCompetitorsAction(
      valid.map((r) => ({ name: r.name.trim(), url: r.url.trim() }))
    );
    setSubmitLoading(false);
    if (result.success && result.data) {
      setCompetitors((prev) => [...prev, ...(result.data as Competitor[])]);
      setAddModalOpen(false);
    } else {
      setFormError(result.error ?? "Failed to add competitors.");
    }
  }, [formRows, setCompetitors]);

  return (
    <div className="space-y-8">
      {/* Add competitor */}
      <section className="flex items-center justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add competitor
        </button>
      </section>

      {activeScanRunId && (
        <ScanProgress
          runId={activeScanRunId}
          status={scanStatus ?? "running"}
          events={scanEvents}
          onCancel={() => {
            setActiveScanRunId(null);
            setScanStatus(null);
          }}
          onComplete={handleScanComplete}
        />
      )}

      {/* Competitors list */}
      <section aria-labelledby="competitors-heading">
        <h2 id="competitors-heading" className="sr-only">
          Available competitors
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onRunScan={() => handleRunScan(competitor.id)}
              isScanning={activeScanRunId === competitor.id}
              showCheckbox
              selected={selectedIds.has(competitor.id)}
              onToggleSelect={() => toggleSelect(competitor.id)}
            />
          ))}
        </div>
        {loading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading competitors…</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {!loading && competitors.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
            <p className="text-zinc-600 dark:text-zinc-400">No competitors yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-3 text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
            >
              Add your first competitor
            </button>
          </div>
        )}
      </section>

      {/* Add competitor form modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-competitor-title"
        >
          <div className="flex h-[32rem] max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="shrink-0 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <h2 id="add-competitor-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Add competitor
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add one or more competitors. Each needs a name and website URL.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSubmit();
              }}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  {formRows.map((row, index) => (
                    <fieldset
                      key={index}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
                    >
                      <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Competitor {index + 1}
                      </legend>
                      <div className="space-y-3">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Name
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Acme Corp"
                            value={row.name}
                            onChange={(e) => updateFormRow(index, "name", e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400"
                            aria-label={`Competitor name ${index + 1}`}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            URL
                          </span>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={row.url}
                            onChange={(e) => updateFormRow(index, "url", e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400"
                            aria-label={`Competitor URL ${index + 1}`}
                          />
                        </label>
                      </div>
                    </fieldset>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addFormRow}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-3 text-sm font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add More
                </button>
                {formError && (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                    {formError}
                  </p>
                )}
              </div>
              <div className="shrink-0 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-zinc-300 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitLoading ? "Adding…" : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
