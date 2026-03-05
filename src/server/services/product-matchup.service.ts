/** Business logic for product vs competitor matchups (create/list). */

import { HttpError } from "@/server/api/errors";
import { competitorRepository } from "@/server/repositories/competitor.repository";
import { productMatchupRepository } from "@/server/repositories/product-matchup.repository";

export interface CreateProductMatchupInput {
  productName: string;
  productSegment?: string | null;
  productPositioning?: string | null;
  productPricingModel?: string | null;
  productUrl?: string | null;
  competitorId: string;
  competitorUrl: string;
  goal: string;
  targetSegment?: string | null;
}

export const productMatchupService = {
  async list(companyId: string) {
    return productMatchupRepository.findMany(companyId);
  },

  async create(companyId: string, input: CreateProductMatchupInput) {
    const productName = input.productName.trim();
    const competitorId = input.competitorId.trim();
    const competitorUrl = input.competitorUrl.trim();
    const goal = input.goal.trim();

    if (!productName) throw new HttpError(422, "productName is required", "VALIDATION_ERROR");
    if (!competitorId) throw new HttpError(422, "competitorId is required", "VALIDATION_ERROR");
    if (!competitorUrl) throw new HttpError(422, "competitorUrl is required", "VALIDATION_ERROR");
    if (!goal) throw new HttpError(422, "goal is required", "VALIDATION_ERROR");

    const competitor = await competitorRepository.findById(companyId, competitorId);
    if (!competitor) throw new HttpError(404, "Competitor not found", "NOT_FOUND");

    return productMatchupRepository.create({
      companyId,
      productName,
      productSegment: input.productSegment?.trim() || null,
      productPositioning: input.productPositioning?.trim() || null,
      productPricingModel: input.productPricingModel?.trim() || null,
      productUrl: input.productUrl?.trim() || null,
      competitorId: competitor.id,
      competitorName: competitor.name,
      competitorUrl,
      goal,
      targetSegment: input.targetSegment?.trim() || null,
    });
  },

  async getById(companyId: string, id: string) {
    const doc = await productMatchupRepository.findById(companyId, id);
    if (!doc) throw new HttpError(404, "Product matchup not found", "NOT_FOUND");
    return doc;
  },
};

