/** Global scan progress state so in-progress scans survive navigation and Status can show multiple runs. */

import { create } from "zustand";

export type ScanProgressStatus = "running" | "completed" | "failed";

export interface ScanProgressEntry {
  id: string;
  competitorId: string;
  competitorName: string;
  /** Origin of the scan: single-competitor run vs bulk "Run all". */
  origin: "single" | "all";
  /** Optional grouping key so bulk runs can be aggregated if needed. */
  groupId?: string;
  status: ScanProgressStatus;
  events: string[];
  startedAt: string;
  completedAt?: string;
  /** Optional URL to embed for live browser view (from TinyFish STREAMING_URL). */
  streamingUrl?: string | null;
}

interface ScanProgressState {
  scans: ScanProgressEntry[];
  addScan: (
    competitorId: string,
    competitorName: string,
    origin?: "single" | "all",
    groupId?: string,
  ) => string;
  updateScanEvents: (scanId: string, eventsToAppend: string[]) => void;
  updateScanStreamingUrl: (scanId: string, url: string | null) => void;
  completeScan: (scanId: string, status: "completed" | "failed") => void;
  removeScan: (scanId: string) => void;
  getRunningScans: () => ScanProgressEntry[];
  getScan: (scanId: string) => ScanProgressEntry | null;
}

function generateScanId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useScanProgressStore = create<ScanProgressState>((set, get) => ({
  scans: [],

  addScan(competitorId: string, competitorName: string, origin: "single" | "all" = "single", groupId?: string) {
    const id = generateScanId();
    const entry: ScanProgressEntry = {
      id,
      competitorId,
      competitorName,
      origin,
      ...(groupId ? { groupId } : {}),
      status: "running",
      events: [],
      startedAt: new Date().toISOString(),
    };
    set((state) => ({ scans: [entry, ...state.scans] }));
    return id;
  },

  updateScanEvents(scanId: string, eventsToAppend: string[]) {
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === scanId ? { ...s, events: [...s.events, ...eventsToAppend] } : s
      ),
    }));
  },

  updateScanStreamingUrl(scanId: string, url: string | null) {
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === scanId ? { ...s, streamingUrl: url } : s
      ),
    }));
  },

  completeScan(scanId: string, status: "completed" | "failed") {
    const completedAt = new Date().toISOString();
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === scanId ? { ...s, status, completedAt } : s
      ),
    }));
  },

  removeScan(scanId: string) {
    set((state) => ({ scans: state.scans.filter((s) => s.id !== scanId) }));
  },

  getRunningScans() {
    return get().scans.filter((s) => s.status === "running");
  },

  getScan(scanId: string) {
    return get().scans.find((s) => s.id === scanId) ?? null;
  },
}));
