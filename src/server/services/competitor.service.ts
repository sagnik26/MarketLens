/** Business logic for Competitor Radar; HTTP-agnostic, uses competitorRepository only. */

import { competitorRepository } from "@/server/repositories/competitor.repository";
import { HttpError } from "@/server/api/errors";
import { SourceChannel, type SourceChannel as SourceChannelType } from "@/constants";

const DEMO_COMPANY_ID = "000000000000000000000000";

interface ListArgs {
  page?: number;
  limit?: number;
}

interface CreateArgs {
  name: string;
  website: string;
  logoUrl?: string | null;
  channels?: SourceChannelType[];
}

interface UpdateArgs {
  name?: string;
  website?: string;
  logoUrl?: string | null;
  isActive?: boolean;
}

export const competitorService = {
  async list({ page, limit }: ListArgs) {
    return competitorRepository.findMany({ companyId: DEMO_COMPANY_ID, page, limit });
  },

  async getById(id: string) {
    const competitor = await competitorRepository.findById(DEMO_COMPANY_ID, id);
    if (!competitor) {
      throw new HttpError(404, "Competitor not found", "NOT_FOUND");
    }
    return competitor;
  },

  async create(data: CreateArgs) {
    if (!data.name.trim()) {
      throw new HttpError(422, "Name is required", "VALIDATION_ERROR");
    }
    if (!data.website.trim()) {
      throw new HttpError(422, "Website is required", "VALIDATION_ERROR");
    }
    const channels = data.channels && data.channels.length ? data.channels : [SourceChannel.PRICING];

    return competitorRepository.create({
      companyId: DEMO_COMPANY_ID,
      name: data.name.trim(),
      website: data.website.trim(),
      logoUrl: data.logoUrl ?? null,
      channels,
    });
  },

  async update(id: string, data: UpdateArgs) {
    const updated = await competitorRepository.update(DEMO_COMPANY_ID, id, data);
    if (!updated) {
      throw new HttpError(404, "Competitor not found", "NOT_FOUND");
    }
    return updated;
  },

  async delete(id: string) {
    const deleted = await competitorRepository.delete(DEMO_COMPANY_ID, id);
    if (!deleted) {
      throw new HttpError(404, "Competitor not found", "NOT_FOUND");
    }
  },
};

