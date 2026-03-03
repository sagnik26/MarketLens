/** Competitor Radar manage view: add competitor, list competitors, run one or multiple scans. */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { CompetitorCard } from "./CompetitorCard";
import { ScanProgress } from "./ScanProgress";
import {
  getCompetitorsAction,
  addCompetitorsAction,
  deleteCompetitorAction,
  getCompetitorChannelSummaryAction,
  type CompetitorChannelSummary,
} from "@/actions/competitor.actions";
import { useCompetitorRadarState } from "./useCompetitorRadarState";
import { useScanProgressStore } from "@/stores/scan-progress.store";
import type { Competitor } from "./competitor-radar.types";
import {
  SourceChannel,
  SOURCE_CHANNEL_LABELS,
  type SourceChannel as SourceChannelType,
} from "@/constants";
import { DashboardShimmer } from "@/components/common";

export function CompetitorManageView() {
  const { competitors, setCompetitors, loading, setLoading, error, setError } =
    useCompetitorRadarState();

  const scans = useScanProgressStore((s) => s.scans);
  const runningScans = scans.filter((sc) => sc.status === "running");
  const addScan = useScanProgressStore((s) => s.addScan);
  const updateScanEvents = useScanProgressStore((s) => s.updateScanEvents);
  const updateScanStreamingUrl = useScanProgressStore((s) => s.updateScanStreamingUrl);
  const completeScan = useScanProgressStore((s) => s.completeScan);
  const removeScan = useScanProgressStore((s) => s.removeScan);
  const getScan = useScanProgressStore((s) => s.getScan);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formRows, setFormRows] = useState<
    { name: string; url: string; channels: SourceChannelType[] }[]
  >([{ name: "", url: "", channels: [SourceChannel.PRICING] }]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [channelSummaries, setChannelSummaries] = useState<
    CompetitorChannelSummary[]
  >([]);
  const [activeChannel, setActiveChannel] = useState<SourceChannelType | "all">(
    "all",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    const [competitorsResult, summaryResult] = await Promise.all([
      getCompetitorsAction(),
      getCompetitorChannelSummaryAction(),
    ]);
    setLoading(false);

    if (competitorsResult.success && competitorsResult.data) {
      const loaded = competitorsResult.data as Competitor[];
      setCompetitors(loaded);
    } else {
      setError(competitorsResult.error ?? "Failed to load competitors");
    }

    if (summaryResult.success && summaryResult.data) {
      setChannelSummaries(summaryResult.data);
    }
  }, [setCompetitors, setLoading, setError, setDeleteError]);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const consumeScanStream = useCallback(
    (
      scanIdOrMap: string | Record<string, string>,
      res: Response,
      doneMessage: string,
    ) => {
      const isMap = typeof scanIdOrMap !== "string";
      const scanIds = isMap ? Object.values(scanIdOrMap) : [scanIdOrMap];
      const firstScanId = scanIds[0];

      const getScanIdForEvent = (event: { competitorId?: string }) =>
        isMap && event.competitorId
          ? (scanIdOrMap as Record<string, string>)[event.competitorId]
          : firstScanId;

      if (!res.body) {
        scanIds.forEach((id) => {
          if (getScan(id)) {
            updateScanEvents(id, ["Error: No response body"]);
            completeScan(id, "failed");
          }
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const read = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith("data:")) continue;
            try {
              const event = JSON.parse(trimmed.replace(/^data:\s*/, "").trim()) as {
                type?: string;
                status?: string;
                streaming_url?: string;
                streamingUrl?: string;
                competitorId?: string;
                error?: string;
                message?: string;
              };
              const targetScanId = getScanIdForEvent(event);
              if (!targetScanId) continue;

              const streamingUrl =
                event.streaming_url ?? event.streamingUrl;
              const hasStreamingUrl =
                (event.type === "STREAMING_URL" || event.streaming_url != null || event.streamingUrl != null) &&
                typeof streamingUrl === "string";
              if (hasStreamingUrl && targetScanId && !getScan(targetScanId)?.streamingUrl) {
                updateScanStreamingUrl(targetScanId, streamingUrl);
              }

              if (event.type === "PROGRESS" && event.message && getScan(targetScanId)) {
                updateScanEvents(targetScanId, [event.message]);
              }
              if (event.type === "COMPLETE") {
                const status = event.status === "completed" ? "completed" : "failed";
                scanIds.forEach((id) => {
                  if (getScan(id)) {
                    updateScanEvents(id, [doneMessage, "Complete"]);
                    completeScan(id, status);
                  }
                });
                return;
              }
              if (event.type === "ERROR") {
                scanIds.forEach((id) => {
                  if (getScan(id)) {
                    updateScanEvents(id, ["Error: " + (event.error ?? "Scan failed")]);
                    completeScan(id, "failed");
                  }
                });
                return;
              }
            } catch {
              // skip malformed
            }
          }
          return read();
        });
      read().catch((err: Error) => {
        scanIds.forEach((id) => {
          if (getScan(id)) {
            updateScanEvents(id, ["Error: " + String(err?.message ?? err)]);
            completeScan(id, "failed");
          }
        });
      });
    },
    [
      getScan,
      updateScanEvents,
      updateScanStreamingUrl,
      completeScan,
    ],
  );

  const handleRunScan = useCallback(
    (competitorId: string) => {
      const competitor = competitors.find((c) => c.id === competitorId);
      const name = competitor?.name ?? "Competitor";
      const channelsForCompetitor = competitor?.channels?.length
        ? competitor.channels
        : [SourceChannel.PRICING];

      const scanId = addScan(competitorId, name, "single");
      updateScanEvents(scanId, ["Calling scan API…"]);

      fetch("/api/v1/scan/run/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorIds: [competitorId],
          channels: channelsForCompetitor,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data: { error?: { message?: string } }) => {
              if (getScan(scanId)) {
                updateScanEvents(scanId, [
                  "Error: " + (data?.error?.message ?? `HTTP ${res.status}`),
                ]);
                completeScan(scanId, "failed");
              }
            });
          }
          consumeScanStream(scanId, res, "Scan finished");
        })
        .catch((err: Error) => {
          if (!getScan(scanId)) return;
          updateScanEvents(scanId, ["Error: " + String(err?.message ?? err)]);
          completeScan(scanId, "failed");
        });
    },
    [
      competitors,
      addScan,
      updateScanEvents,
      completeScan,
      getScan,
      consumeScanStream,
    ],
  );

  const handleScanDone = useCallback(
    (scanId: string) => {
      removeScan(scanId);
      loadCompetitors();
    },
    [removeScan, loadCompetitors],
  );

  const openAddModal = useCallback(() => {
    setFormRows([{ name: "", url: "", channels: [SourceChannel.PRICING] }]);
    setFormError(null);
    setAddModalOpen(true);
  }, []);

  const addFormRow = useCallback(() => {
    setFormRows((prev) => [
      ...prev,
      { name: "", url: "", channels: [SourceChannel.PRICING] },
    ]);
  }, []);

  const updateFormRow = useCallback(
    (index: number, field: "name" | "url", value: string) => {
      setFormRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const handleDelete = useCallback(
    async (competitor: Competitor) => {
      if (!window.confirm(`Remove "${competitor.name}" from your competitors?`))
        return;
      setDeleteError(null);
      setDeletingId(competitor.id);
      const result = await deleteCompetitorAction(competitor.id);
      setDeletingId(null);
      if (result.success) {
        setCompetitors((prev) => prev.filter((c) => c.id !== competitor.id));
      } else {
        setDeleteError(result.error ?? "Failed to delete competitor.");
      }
    },
    [setCompetitors],
  );

  const handleAddSubmit = useCallback(async () => {
    const validRows = formRows.filter((r) => r.name.trim() && r.url.trim());
    if (validRows.length === 0) {
      setFormError("Add at least one competitor with name and URL.");
      return;
    }
    setFormError(null);
    setSubmitLoading(true);
    const result = await addCompetitorsAction(
      validRows.map((r) => ({
        name: r.name.trim(),
        url: r.url.trim(),
        channels:
          r.channels && r.channels.length
            ? r.channels
            : [SourceChannel.PRICING],
      })),
    );
    setSubmitLoading(false);
    if (result.success && result.data) {
      const created = result.data as Competitor[];
      setCompetitors((prev) => [...prev, ...created]);
      setAddModalOpen(false);
    } else {
      setFormError(result.error ?? "Failed to add competitors.");
    }
  }, [formRows, setCompetitors]);

  const sourceChannels: SourceChannelType[] = useMemo(
    () => [
      SourceChannel.PRICING,
      SourceChannel.JOBS,
      SourceChannel.PRODUCT,
      SourceChannel.FEATURES,
      SourceChannel.REVIEWS,
    ],
    [],
  );

  const globalChannelTotals = useMemo(() => {
    const totals: Record<SourceChannelType, number> = {
      [SourceChannel.PRICING]: 0,
      [SourceChannel.JOBS]: 0,
      [SourceChannel.PRODUCT]: 0,
      [SourceChannel.FEATURES]: 0,
      [SourceChannel.REVIEWS]: 0,
    };

    // Count how many competitors are configured for each channel (so filters
    // always reflect visible cards, even before any scans have produced data).
    for (const competitor of competitors) {
      const channelsForCompetitor =
        competitor.channels && competitor.channels.length > 0
          ? competitor.channels
          : [SourceChannel.PRICING];

      channelsForCompetitor.forEach((ch) => {
        totals[ch] += 1;
      });
    }

    return totals;
  }, [competitors]);

  const filteredCompetitors = useMemo(() => {
    if (activeChannel === "all") return competitors;

    // Filter by the channels configured on each competitor so filters
    // work even before any scans have produced summary data.
    return competitors.filter((c) => c.channels?.includes(activeChannel));
  }, [activeChannel, competitors]);

  if (loading && competitors.length === 0) {
    return (
      <div className="min-h-[60vh]">
        <DashboardShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toolbar: filters + actions in a single row */}
      <section className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Source channels
        </span>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveChannel("all")}
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeChannel === "all"
                  ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                  : "border-neutral-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-violet-700"
              }`}
            >
              All
            </button>
            {sourceChannels.map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => setActiveChannel(channel)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeChannel === channel
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-violet-700"
                }`}
              >
                <span>{SOURCE_CHANNEL_LABELS[channel]}</span>
                <span
                  className={`ml-1 inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-black/5 px-1 text-[10px] font-semibold ${
                    activeChannel === channel
                      ? "bg-black/10 text-white"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {globalChannelTotals[channel] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add competitor
            </button>
            <button
              type="button"
              disabled={competitors.length === 0 || loading || runningScans.length > 0}
              onClick={() => {
                if (competitors.length === 0) return;
                const competitorIds = competitors.map((c) => c.id);
                const allChannels = new Set<SourceChannelType>();
                competitors.forEach((c) => {
                  if (c.channels && c.channels.length) {
                    c.channels.forEach((ch) => allChannels.add(ch));
                  } else {
                    allChannels.add(SourceChannel.PRICING);
                  }
                });
                const groupId = `all-${Date.now()}`;
                const competitorIdToScanId: Record<string, string> = {};
                competitors.forEach((c, index) => {
                  const scanId = addScan(c.id, c.name, "all", groupId);
                  competitorIdToScanId[c.id] = scanId;
                  if (index === 0) {
                    updateScanEvents(scanId, ["Calling scan API for all competitors…"]);
                  }
                });

                fetch("/api/v1/scan/run/stream", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    competitorIds,
                    channels: Array.from(allChannels),
                  }),
                })
                  .then((res) => {
                    if (!res.ok) {
                      return res.json().then((data: { error?: { message?: string } }) => {
                        const errMsg = data?.error?.message ?? `HTTP ${res.status}`;
                        Object.values(competitorIdToScanId).forEach((scanId) => {
                          if (getScan(scanId)) {
                            updateScanEvents(scanId, ["Error: " + errMsg]);
                            completeScan(scanId, "failed");
                          }
                        });
                      });
                    }
                    consumeScanStream(competitorIdToScanId, res, "All scans finished");
                  })
                  .catch((err: Error) => {
                    Object.values(competitorIdToScanId).forEach((scanId) => {
                      if (getScan(scanId)) {
                        updateScanEvents(scanId, [
                          "Error: " + String(err?.message ?? err),
                        ]);
                        completeScan(scanId, "failed");
                      }
                    });
                  });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-violet-700"
            >
              Run all scans
            </button>
          </div>
        </div>
      </section>

      {scans.length > 0 && (
        <div className="space-y-3">
          {/* Single-competitor scans are shown one card per scan */}
          {scans
            .filter((scan) => scan.origin === "single")
            .map((scan) => (
              <ScanProgress
                key={scan.id}
                runId={scan.id}
                status={scan.status}
                events={scan.events}
                competitorName={scan.competitorName}
                onCancel={() => scan.status === "running" && removeScan(scan.id)}
                onComplete={() => handleScanDone(scan.id)}
              />
            ))}

          {/* Bulk \"Run all\" scans are grouped into a single synthetic \"All\" card per groupId */}
          {Array.from(
            scans
              .filter((scan) => scan.origin === "all")
              .reduce<Map<string, typeof scans>>((map, scan) => {
                const key = scan.groupId ?? "all";
                const existing = map.get(key) ?? [];
                existing.push(scan);
                map.set(key, existing);
                return map;
              }, new Map()),
          ).map(([groupId, groupScans]) => {
            if (groupScans.length === 0) return null;
            const primary = groupScans[0];
            const anyRunning = groupScans.some((s) => s.status === "running");
            const groupStatus = anyRunning
              ? "running"
              : groupScans.every((s) => s.status === "completed")
                ? "completed"
                : "failed";

            const allEvents = groupScans.flatMap((s) => s.events);

            return (
              <ScanProgress
                key={`all-${groupId}`}
                runId={primary.id}
                status={groupStatus}
                events={allEvents}
                competitorName="All"
                onCancel={() => {
                  if (!anyRunning) return;
                  groupScans.forEach((s) => removeScan(s.id));
                }}
                onComplete={() => {
                  groupScans.forEach((s) => handleScanDone(s.id));
                }}
              />
            );
          })}
        </div>
      )}

      {/* Competitors list */}
      <section aria-labelledby="competitors-heading">
        <h2 id="competitors-heading" className="sr-only">
          Available competitors
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onRunScan={() => handleRunScan(competitor.id)}
              isScanning={runningScans.some(
                (s) =>
                  s.competitorId === competitor.id || s.competitorId === "all",
              )}
              onDelete={() => handleDelete(competitor)}
              isDeleting={deletingId === competitor.id}
            />
          ))}
        </div>
        {loading && competitors.length > 0 && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Refreshing competitors…
          </p>
        )}
        {(error || deleteError) && (
          <p
            className="mt-4 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {deleteError ?? error}
          </p>
        )}
        {!loading && competitors.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
            <p className="text-zinc-600 dark:text-zinc-400">
              No competitors yet.
            </p>
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
              <h2
                id="add-competitor-title"
                className="text-xl font-semibold text-zinc-900 dark:text-zinc-100"
              >
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
                            onChange={(e) =>
                              updateFormRow(index, "name", e.target.value)
                            }
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
                            onChange={(e) =>
                              updateFormRow(index, "url", e.target.value)
                            }
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400"
                            aria-label={`Competitor URL ${index + 1}`}
                          />
                        </label>
                        <div className="pt-1.5">
                          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Select channel
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {sourceChannels.map((channel) => {
                              const isActive = row.channels.includes(channel);
                              return (
                                <button
                                  key={channel}
                                  type="button"
                                  onClick={() => {
                                    setFormRows((prev) => {
                                      const next = [...prev];
                                      const current = next[index];
                                      const currentChannels =
                                        current.channels ?? [];
                                      const updatedChannels =
                                        currentChannels.includes(channel)
                                          ? currentChannels.filter(
                                              (c) => c !== channel,
                                            )
                                          : [...currentChannels, channel];
                                      next[index] = {
                                        ...current,
                                        channels: updatedChannels,
                                      };
                                      return next;
                                    });
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                                    isActive
                                      ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                                      : "border-neutral-200 bg-white text-zinc-700 hover:border-violet-200 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-zinc-300 dark:hover:border-violet-700"
                                  }`}
                                >
                                  <span>{SOURCE_CHANNEL_LABELS[channel]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addFormRow}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-3 text-sm font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add More
                </button>
                {formError && (
                  <p
                    className="mt-4 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
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
