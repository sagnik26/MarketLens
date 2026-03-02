/** Client state for Competitor Radar: competitors, changes, insights, active scan. */

import { useState } from "react";
import type { Competitor, Change, Insight, ScanStatus } from "./competitor-radar.types";

export function useCompetitorRadarState() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeScanRunId, setActiveScanRunId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scanEvents, setScanEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
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
  };
}
