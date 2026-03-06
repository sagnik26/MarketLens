/** Shared types for Tinyfish-driven scans, agent status, and backend-normalized entities. */

import type { SourceChannel } from "@/constants";

export type ScanRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface ScanRun {
  id: string;
  tinyfishRunId: string;
  goalName: string;
  status: ScanRunStatus;
  startedAt: string;
  completedAt: string | null;
  totalSignals: number;
  totalInsights: number;
  totalCompetitors: number;
  errorMessage?: string;
}

export interface AgentStatus {
  name: "scan-agent" | "insight-agent";
  currentRun?: ScanRun;
  lastRun?: ScanRun;
  queueSize: number;
  lastErrorAt?: string;
  lastErrorMessage?: string;
}

/** Minimal backend view of a competitor for analytics and dashboards. */
export interface EnrichedCompetitor {
  id: string;
  name: string;
  website: string;
  logoUrl: string | null;
  isActive: boolean;
  segment?: string;
  tags?: string[];
  lastScanAt?: string;
  lastSignalCount?: number;
}

/** Backend-normalized Change used for analytics (extends stored Change with pageType/url). */
export interface BackendChange {
  id: string;
  competitorId: string;
  competitorName: string;
  matchupId?: string;
  changeType: string;
  signalType: string;
  priority: string;
  title: string;
  summary: string | null;
  rawExtracted?: unknown;
  isRead: boolean;
  isDismissed: boolean;
  detectedAt: string;
  pageType?: SourceChannel;
  url?: string;
}

/** Backend-normalized Insight used for analytics (global or per-competitor). */
export interface BackendInsight {
  id: string;
  competitorId: string | null;
  competitorName: string | null;
  matchupId?: string;
  title: string;
  briefing: string;
  signalType: string;
  priority: string;
  recommendedActions: string[];
  generatedAt: string;
  pageType?: SourceChannel;
  score?: number;
  tags?: string[];
}

