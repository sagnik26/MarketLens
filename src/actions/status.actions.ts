/** Server Action: exposes lightweight status summary for agents and recent runs. */
"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { AgentStatus, ScanRun } from "@/types";
import { scanRepository } from "@/server/repositories/scan.repository";

interface StatusSummary {
  agents: AgentStatus[];
  recentRuns: ScanRun[];
}

const DEMO_COMPANY_ID = "000000000000000000000000";

export async function getStatusSummaryAction(): Promise<ActionResponse<StatusSummary>> {
  const { scanRuns } = await scanRepository.findMany({
    companyId: DEMO_COMPANY_ID,
    page: 1,
    limit: 20,
  });

  const recentRuns = scanRuns;
  const lastRun = recentRuns[0] ?? undefined;

  const agents: AgentStatus[] = [
    { name: "scan-agent", currentRun: undefined, lastRun, queueSize: 0 },
    { name: "insight-agent", currentRun: undefined, lastRun, queueSize: 0 },
  ];

  return {
    success: true,
    data: { agents, recentRuns },
  };
}

