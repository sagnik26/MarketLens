/** Server Action: exposes lightweight status summary for agents and recent runs. */
"use server";

import { unstable_cache } from "next/cache";
import type { ActionResponse } from "@/types/actions.types";
import type { AgentStatus, ScanRun } from "@/types";
import { scanRepository } from "@/server/repositories/scan.repository";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

const CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes
const STATUS_TAG = "status";

interface StatusSummary {
  agents: AgentStatus[];
  recentRuns: ScanRun[];
}

async function getStatusSummaryCached(companyId: string) {
  return unstable_cache(
    async () => {
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
      return { agents, recentRuns };
    },
    [STATUS_TAG, "summary", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [STATUS_TAG] }
  )();
}

export async function getStatusSummaryAction(): Promise<ActionResponse<StatusSummary>> {
  const { companyId } = await getServerAuthContext();
  const data = await getStatusSummaryCached(companyId);
  return { success: true, data };
}

