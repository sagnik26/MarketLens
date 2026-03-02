/** Server Action: compliance summary backed by scanService.runComplianceScan. */
"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { BackendChange, BackendInsight, ScanRun } from "@/types";
import { scanService } from "@/server/services/scan.service";

export interface ComplianceSummary {
  lastRun: ScanRun | null;
  changes: BackendChange[];
  insights: BackendInsight[];
}

export async function getComplianceSummaryAction(): Promise<ActionResponse<ComplianceSummary>> {
  // For now, use a fixed sample BSE/NSE URL as the target; in a real app this would come from configuration.
  const targetUrl = "https://www.bseindia.com/markets/MarketInfo/DispNewNoticesCirculars.aspx";

  const { scanRun, changes, insights } = await scanService.runComplianceScan(targetUrl);

  return {
    success: true,
    data: {
      lastRun: scanRun,
      changes,
      insights,
    },
  };
}

