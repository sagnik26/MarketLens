import { competitorRepository } from "@/server/repositories/competitor.repository";
import { changeRepository } from "@/server/repositories/change.repository";
import { NotFoundError } from "@/server/api/errors";
import { ChangeType, SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";
import type { BackendChange } from "@/types";

const DEFAULT_LIMIT = 200;

export interface BattlecardSection {
  id: "pricing" | "features" | "jobs" | "reviews" | "changelog" | "recent";
  title: string;
  description: string;
  changes: BackendChange[];
}

export const battlecardService = {
  async getForCompetitor(params: {
    companyId: string;
    competitorId: string;
    limit?: number;
  }) {
    const { companyId, competitorId, limit = DEFAULT_LIMIT } = params;

    const competitor = await competitorRepository.findById(companyId, competitorId);
    if (!competitor) throw new NotFoundError("Competitor");

    const changes = await changeRepository.findByCompetitor({
      companyId,
      competitorId,
      limit,
    });

    const byPageType = (pageType: SourceChannelType) =>
      changes.filter((c) => (c.pageType as SourceChannelType | undefined) === pageType);

    const pricingChanges = changes.filter((c) => c.changeType === ChangeType.PRICING);
    const featuresChanges = changes.filter(
      (c) =>
        c.changeType === ChangeType.FEATURE_ADD ||
        c.changeType === ChangeType.FEATURE_REMOVE,
    );

    const sections: BattlecardSection[] = (
      [
        {
          id: "recent" as const,
          title: "Recent moves",
          description: "Latest detected signals across all tracked sources.",
          changes: changes.slice(0, 12),
        },
        {
          id: "pricing" as const,
          title: "Pricing",
          description: "Changes related to plans, tiers, limits, or packaging.",
          changes: pricingChanges.slice(0, 12),
        },
        {
          id: "features" as const,
          title: "Feature signals",
          description: "Detected feature adds/removals and capability updates.",
          changes: featuresChanges.slice(0, 12),
        },
        {
          id: "jobs" as const,
          title: "Hiring signals",
          description: "Signals from job postings that may indicate direction.",
          changes: byPageType(SourceChannel.JOBS).slice(0, 12),
        },
        {
          id: "changelog" as const,
          title: "Changelog/release notes",
          description: "Recent product updates and releases.",
          changes: byPageType(SourceChannel.CHANGELOG).slice(0, 12),
        },
        {
          id: "reviews" as const,
          title: "Reviews",
          description: "Trends and pain points surfaced from customer reviews.",
          changes: byPageType(SourceChannel.REVIEWS).slice(0, 12),
        },
      ] satisfies BattlecardSection[]
    ).filter((s) => s.changes.length > 0);

    return { competitor, sections };
  },
};

