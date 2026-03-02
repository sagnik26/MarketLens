/** In-memory store for recent scan runs and signals so Status, Insights, and Information pages can show them.
 * This is a temporary layer until ScanRun/Change/Insight are fully persisted in MongoDB.
 */

import type { BackendChange, BackendInsight, ScanRun } from "@/types";

const MAX_RECENT_RUNS = 20;
const MAX_RECENT_SIGNALS = 200;

const recentRuns: ScanRun[] = [];
const recentChanges: BackendChange[] = [];
const recentInsights: BackendInsight[] = [];

export function addRecentResult(run: ScanRun, changes: BackendChange[], insights: BackendInsight[]): void {
  // Runs
  recentRuns.unshift(run);
  if (recentRuns.length > MAX_RECENT_RUNS) recentRuns.pop();

  // Changes
  if (changes.length) {
    recentChanges.unshift(...changes);
    if (recentChanges.length > MAX_RECENT_SIGNALS) {
      recentChanges.splice(MAX_RECENT_SIGNALS);
    }
  }

  // Insights
  if (insights.length) {
    recentInsights.unshift(...insights);
    if (recentInsights.length > MAX_RECENT_SIGNALS) {
      recentInsights.splice(MAX_RECENT_SIGNALS);
    }
  }
}

export function getRecentRuns(): ScanRun[] {
  return [...recentRuns];
}

export function getRecentSignals(): { changes: BackendChange[]; insights: BackendInsight[] } {
  return {
    changes: [...recentChanges],
    insights: [...recentInsights],
  };
}
