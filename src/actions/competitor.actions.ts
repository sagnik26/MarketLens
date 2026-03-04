/** Server Actions for fetching and adding competitors (Competitor Radar) backed by MongoDB. */

"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { Competitor } from "@/components/features/competitor-radar/competitor-radar.types";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { competitorService } from "@/server/services/competitor.service";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { getServerAuthContext } from "@/server/lib/auth/server-context";

/** Returns list of competitors for the authenticated company. Backed by MongoDB. */
export async function getCompetitorsAction(): Promise<ActionResponse<Competitor[]>> {
  const { companyId } = await getServerAuthContext();
  const { competitors } = await competitorService.list(companyId, { page: 1, limit: 100 });
  return { success: true, data: competitors as Competitor[] };
}

export interface AddCompetitorInput {
  name: string;
  url: string;
  channels?: SourceChannelType[];
}

/** Adds one or more competitors. Returns the newly created competitors. Mock: in-memory store. */
export async function addCompetitorsAction(
  inputs: AddCompetitorInput[]
): Promise<ActionResponse<Competitor[]>> {
  const valid = inputs.filter((i) => i.name.trim() && i.url.trim());
  if (valid.length === 0) {
    return { success: false, error: "At least one competitor with name and URL is required." };
  }
  const created: Competitor[] = [];

  for (const input of valid) {
    let website = input.url.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    const { companyId } = await getServerAuthContext();
    const competitor = await competitorService.create(companyId, {
      name: input.name.trim(),
      website,
      logoUrl: null,
      channels: input.channels && input.channels.length ? input.channels : [SourceChannel.PRICING],
    });
    created.push(competitor as Competitor);
  }

  return { success: true, data: created };
}

/** Deletes a competitor by id. Returns success or error. */
export async function deleteCompetitorAction(id: string): Promise<ActionResponse<void>> {
  if (!id?.trim()) {
    return { success: false, error: "Competitor id is required." };
  }
  try {
    const { companyId } = await getServerAuthContext();
    await competitorService.delete(companyId, id.trim());
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete competitor.";
    return { success: false, error: message };
  }
}

export interface ChannelCounts {
  channel: SourceChannelType;
  totalSignals: number;
}

export interface CompetitorChannelSummary {
  competitorId: string;
  competitorName: string;
  channels: ChannelCounts[];
}

/** Aggregate: per-competitor per-channel signal counts used for Competitor Radar filters. Currently zero until scans are persisted. */
export async function getCompetitorChannelSummaryAction(): Promise<ActionResponse<CompetitorChannelSummary[]>> {
  const channelOrder: SourceChannelType[] = [
    SourceChannel.PRICING,
    SourceChannel.JOBS,
    SourceChannel.PRODUCT,
    SourceChannel.FEATURES,
    SourceChannel.REVIEWS,
  ];

  const { companyId } = await getServerAuthContext();
  const { competitors } = await competitorRepository.findMany({
    companyId,
    page: 1,
    limit: 100,
  });

  const summaries: CompetitorChannelSummary[] = competitors.map((competitor: { id: string; name: string }) => {
    const channels: ChannelCounts[] = channelOrder.map((channel) => ({
      channel,
      totalSignals: 0,
    }));

    return {
      competitorId: competitor.id,
      competitorName: competitor.name,
      channels,
    };
  });

  return { success: true, data: summaries };
}

