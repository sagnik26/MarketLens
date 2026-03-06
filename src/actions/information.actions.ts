/** Server Action: cached information overview (workspace summary + matchups rows). */
"use server";

import { unstable_cache } from "next/cache";
import type { ActionResponse } from "@/types/actions.types";
import {
  informationService,
  type InformationSummary,
} from "@/server/services/information.service";
import { productMatchupService } from "@/server/services/product-matchup.service";
import { changeRepository } from "@/server/repositories/change.repository";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

const CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes
const INFORMATION_TAG = "information";

export interface MatchupRow {
  matchup: {
    id: string;
    productName: string;
    competitorName: string;
    competitorUrl: string;
    goal: string;
  };
  lastChange: { detectedAt: string; rawExtracted?: unknown } | null;
}

export interface InformationOverview {
  summary: InformationSummary;
  matchupsRows: MatchupRow[];
}

async function getInformationOverviewCached(companyId: string): Promise<InformationOverview> {
  return unstable_cache(
    async () => {
      const [summary, matchups] = await Promise.all([
        informationService.getSummary(companyId),
        productMatchupService.list(companyId),
      ]);
      const matchupsRows: MatchupRow[] = await Promise.all(
        matchups.map(async (m) => {
          const recent = await changeRepository.findRecentByCompany({
            companyId,
            matchupId: m.id,
            limit: 1,
          });
          const last = recent[0] ?? null;
          return {
            matchup: {
              id: m.id,
              productName: m.productName,
              competitorName: m.competitorName,
              competitorUrl: m.competitorUrl,
              goal: m.goal,
            },
            lastChange: last
              ? { detectedAt: last.detectedAt, rawExtracted: last.rawExtracted }
              : null,
          };
        }),
      );
      return { summary, matchupsRows };
    },
    [INFORMATION_TAG, "overview", companyId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [INFORMATION_TAG] }
  )();
}

export type { InformationSummary };

export async function getInformationOverviewAction(): Promise<ActionResponse<InformationOverview>> {
  const { companyId } = await getServerAuthContext();
  const data = await getInformationOverviewCached(companyId);
  return { success: true, data };
}
