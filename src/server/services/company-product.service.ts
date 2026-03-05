/** Business logic for CompanyProduct entities (create/list). */

import { HttpError } from "@/server/api/errors";
import { companyProductRepository } from "@/server/repositories/company-product.repository";

export const companyProductService = {
  async list(companyId: string) {
    return companyProductRepository.findMany(companyId);
  },

  async create(companyId: string, input: {
    name: string;
    segment?: string | null;
    positioning?: string | null;
    pricingModel?: string | null;
    productUrl?: string | null;
  }) {
    const name = input.name.trim();
    if (!name) throw new HttpError(422, "name is required", "VALIDATION_ERROR");

    return companyProductRepository.create({
      companyId,
      name,
      segment: input.segment?.trim() || null,
      positioning: input.positioning?.trim() || null,
      pricingModel: input.pricingModel?.trim() || null,
      productUrl: input.productUrl?.trim() || null,
    });
  },
};

