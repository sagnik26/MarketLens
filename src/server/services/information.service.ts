/** Business logic for Information page: competitor radar + compliance summaries derived from backend. */

import { SOURCE_CHANNEL_LABELS, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { changeRepository } from "@/server/repositories/change.repository";

export interface InformationProfile {
  competitorId: string;
  name: string;
  segment: string;
  focus: string;
  lastScan: string;
  channel: SourceChannelType;
}

export interface CompetitorRadarInformation {
  channels: {
    channel: SourceChannelType;
    label: string;
    profiles: InformationProfile[];
  }[];
}

export interface ComplianceRadarInformation {
  summaries: {
    title: string;
    description: string;
  }[];
}

export interface InformationSummary {
  competitorRadar: CompetitorRadarInformation;
  complianceRadar: ComplianceRadarInformation;
}

export const informationService = {
  async getSummary(companyId: string): Promise<InformationSummary> {
    const allChannels: SourceChannelType[] = [
      SourceChannel.PRICING,
      SourceChannel.JOBS,
      SourceChannel.PRODUCT,
      SourceChannel.FEATURES,
      SourceChannel.CHANGELOG,
      SourceChannel.REVIEWS,
    ];

    const { competitors } = await competitorRepository.findMany({
      companyId,
      page: 1,
      limit: 100,
    });

    const changes = await changeRepository.findRecentByCompany({
      companyId,
      limit: 500,
    });

    const channels = allChannels
      .map((channel) => {
        const label = SOURCE_CHANNEL_LABELS[channel];

        // Only include competitors that actually have signals for this channel.
        const profiles = competitors
          .map<InformationProfile | null>((c) => {
            const matching = changes.filter(
              (chg) => chg.competitorId === c.id && chg.pageType === channel,
            );

            if (matching.length === 0) return null;

            const latest = matching.reduce(
              (latest, chg) =>
                new Date(chg.detectedAt) > new Date(latest.detectedAt) ? chg : latest,
              matching[0],
            );

            const count = matching.length;

            return {
              competitorId: c.id,
              name: c.name,
              segment:
                channel === SourceChannel.JOBS
                  ? "Hiring"
                  : channel === SourceChannel.REVIEWS
                    ? "Reviews"
                    : channel === SourceChannel.CHANGELOG
                      ? "Changelog"
                      : "Product",
              focus: `${count} ${label.toLowerCase()} signal${count === 1 ? "" : "s"} detected. Latest: ${latest.title}`,
              lastScan: latest.detectedAt,
              channel,
            };
          })
          .filter((p): p is InformationProfile => p !== null);

        return { channel, label, profiles };
      })
      .filter((group) => group.profiles.length > 0);

    const competitorRadar: CompetitorRadarInformation = { channels };
    const complianceRadar: ComplianceRadarInformation = {
      summaries: [],
    };

    return { competitorRadar, complianceRadar };
  },

  async getChannelDetails(params: {
    companyId: string;
    channel: SourceChannelType;
    competitorId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    channel: SourceChannelType;
    label: string;
    changes: {
      id: string;
      competitorId: string;
      competitorName: string;
      title: string;
      summary: string | null;
      detectedAt: string;
      url?: string;
    }[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { companyId, channel, competitorId, page = 1, limit = 10 } = params;

    const changes = await changeRepository.findRecentByCompany({
      companyId,
      limit: 500,
      pageType: channel,
    });

    const filtered = competitorId
      ? changes.filter((chg) => chg.competitorId === competitorId)
      : changes;

    const total = filtered.length;
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safePage = Math.max(1, page);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;

    const paged = filtered.slice(start, end);

    const mapped = paged.map((chg) => ({
      id: chg.id,
      competitorId: chg.competitorId,
      competitorName: chg.competitorName,
      title: chg.title,
      summary: chg.summary,
      detectedAt: chg.detectedAt,
      url: chg.url,
    }));

    return {
      channel,
      label: SOURCE_CHANNEL_LABELS[channel],
      changes: mapped,
      total,
      page: safePage,
      totalPages,
    };
  },
};

