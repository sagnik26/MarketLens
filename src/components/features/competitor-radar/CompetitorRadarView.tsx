/** Competitor Radar main view: competitor list, scan progress, changes feed, insights. */

"use client";

import { useState, useCallback, useEffect } from "react";
import { CompetitorCard } from "./CompetitorCard";
import { ScanProgress } from "./ScanProgress";
import { ChangesFeed } from "./ChangesFeed";
import { InsightCard } from "./InsightCard";
import { ActionItemModal } from "./ActionItemModal";
import { getCompetitorsAction } from "@/actions/competitor.actions";
import { getChangesAction, getInsightsAction } from "@/actions/scan.actions";
import { useCompetitorRadarState } from "./useCompetitorRadarState";
import type { Competitor, Change, Insight } from "./competitor-radar.types";

export function CompetitorRadarView() {
  const {
    competitors,
    setCompetitors,
    changes,
    setChanges,
    insights,
    setInsights,
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

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalChangeId, setActionModalChangeId] = useState<string | null>(null);
  const [actionModalInsightId, setActionModalInsightId] = useState<string | null>(null);

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getCompetitorsAction();
    setLoading(false);
    if (result.success && result.data) setCompetitors(result.data as Competitor[]);
    else setError(result.error ?? "Failed to load competitors");
  }, [setCompetitors, setLoading, setError]);

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

  const handleOpenActionModal = useCallback((changeId: string | null, insightId: string | null) => {
    setActionModalChangeId(changeId);
    setActionModalInsightId(insightId);
    setActionModalOpen(true);
  }, []);

  const handleActionModalSuccess = useCallback(() => {
    setActionModalOpen(false);
    setActionModalChangeId(null);
    setActionModalInsightId(null);
  }, []);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  useEffect(() => {
    getChangesAction().then((r) => r.success && r.data && setChanges(r.data as Change[]));
    getInsightsAction().then((r) => r.success && r.data && setInsights(r.data as Insight[]));
  }, [setChanges, setInsights]);

  useEffect(() => {
    if (!activeScanRunId || scanStatus !== "running") return;
    const t = setTimeout(() => {
      setScanEvents((e) => [...e, "Navigating to page", "Extracting data", "Complete"]);
      setScanStatus("completed");
    }, 2500);
    return () => clearTimeout(t);
  }, [activeScanRunId, scanStatus, setScanEvents, setScanStatus]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="competitors-heading">
        <h2 id="competitors-heading" className="sr-only">
          Competitors
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onRunScan={() => handleRunScan(competitor.id)}
              isScanning={activeScanRunId === competitor.id}
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

      {changes.length > 0 && (
        <section aria-labelledby="changes-heading">
          <h2 id="changes-heading" className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Recent changes
          </h2>
          <ChangesFeed
            changes={changes}
            onCreateAction={(changeId) => handleOpenActionModal(changeId, null)}
          />
        </section>
      )}

      {insights.length > 0 && (
        <section aria-labelledby="insights-heading">
          <h2 id="insights-heading" className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Insights
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onCreateAction={() => handleOpenActionModal(null, insight.id)}
              />
            ))}
          </div>
        </section>
      )}

      <ActionItemModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        changeId={actionModalChangeId}
        insightId={actionModalInsightId}
        onSuccess={handleActionModalSuccess}
      />
    </div>
  );
}
