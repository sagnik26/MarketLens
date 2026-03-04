import { competitorRepository } from "@/server/repositories/competitor.repository";
import { changeRepository } from "@/server/repositories/change.repository";
import { NotFoundError } from "@/server/api/errors";

const DEFAULT_LIMIT = 200;

export const timelineService = {
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

    return { competitor, changes };
  },
};

