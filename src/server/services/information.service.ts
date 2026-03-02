/** Business logic for Information page: competitor radar + compliance summaries derived from backend. */

import { SOURCE_CHANNEL_LABELS, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { changeRepository } from "@/server/repositories/change.repository";

export interface InformationProfile {
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
const DEMO_COMPANY_ID = "000000000000000000000000";

export const informationService = {
  async getSummary(): Promise<InformationSummary> {
    const allChannels: SourceChannelType[] = [
      SourceChannel.PRICING,
      SourceChannel.JOBS,
      SourceChannel.PRODUCT_HUNT,
      SourceChannel.FEATURES,
    ];

    const { competitors } = await competitorRepository.findMany({
      companyId: DEMO_COMPANY_ID,
      page: 1,
      limit: 100,
    });

    const changes = await changeRepository.findRecentByCompany({
      companyId: DEMO_COMPANY_ID,
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
              name: c.name,
              segment: channel === SourceChannel.JOBS ? "Hiring" : "Product",
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
};

