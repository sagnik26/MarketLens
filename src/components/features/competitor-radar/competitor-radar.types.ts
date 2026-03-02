/** Domain types for Competitor Radar UI and Server Action payloads. */

import type { SourceChannel } from "@/constants";

export interface Competitor {
  id: string;
  name: string;
  website: string;
  logoUrl: string | null;
  isActive: boolean;
  channels: SourceChannel[];
}

export interface Change {
  id: string;
  competitorId: string;
  competitorName: string;
  changeType: string;
  signalType: string;
  priority: string;
  title: string;
  summary: string | null;
  isRead: boolean;
  isDismissed: boolean;
  detectedAt: string;
}

export interface Insight {
  id: string;
  competitorId: string;
  competitorName: string;
  title: string;
  briefing: string;
  signalType: string;
  priority: string;
  recommendedActions: string[];
  generatedAt: string;
}

export type ScanStatus = "running" | "completed" | "partial" | "failed";

export interface ScanRunSummary {
  id: string;
  status: ScanStatus;
  competitorId: string;
  competitorName: string;
  newChangesCount: number;
  startedAt: string;
  completedAt: string | null;
}
