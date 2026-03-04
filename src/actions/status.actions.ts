/** Server Action: exposes lightweight status summary for agents and recent runs. */
"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { AgentStatus, ScanRun } from "@/types";
import { scanRepository } from "@/server/repositories/scan.repository";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

interface StatusSummary {
  agents: AgentStatus[];
  recentRuns: ScanRun[];
}

export async function getStatusSummaryAction(): Promise<ActionResponse<StatusSummary>> {
  const { companyId } = await getServerAuthContext();
  const { scanRuns } = await scanRepository.findMany({
    companyId,
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

