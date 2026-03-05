/** All DB queries for ProductMatchup; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import {
  ProductMatchupModel,
  type ProductMatchupResponse,
} from "@/server/models/ProductMatchup.model";

interface CreateArgs {
  companyId: string;
  productName: string;
  productSegment?: string | null;
  productPositioning?: string | null;
  productPricingModel?: string | null;
  productUrl?: string | null;
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  goal: string;
  targetSegment?: string | null;
}

interface ProductMatchupLeanDoc {
  _id: mongoose.Types.ObjectId;
  productName: string;
  productSegment?: string | null;
  productPositioning?: string | null;
  productPricingModel?: string | null;
  productUrl?: string | null;
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  goal: string;
  targetSegment?: string | null;
  createdAt: Date;
}

function toResponseFromLean(doc: ProductMatchupLeanDoc): ProductMatchupResponse {
  return {
    id: doc._id.toString(),
    productName: doc.productName,
    productSegment: doc.productSegment ?? null,
    productPositioning: doc.productPositioning ?? null,
    productPricingModel: doc.productPricingModel ?? null,
    productUrl: doc.productUrl ?? null,
    competitorId: doc.competitorId,
    competitorName: doc.competitorName,
    competitorUrl: doc.competitorUrl,
    goal: doc.goal,
    targetSegment: doc.targetSegment ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const productMatchupRepository = {
  async findMany(companyId: string): Promise<ProductMatchupResponse[]> {
    await dbConnect();
    const rows = await ProductMatchupModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<ProductMatchupLeanDoc[]>();

    return rows.map(toResponseFromLean);
  },

  async create(args: CreateArgs): Promise<ProductMatchupResponse> {
    await dbConnect();
    const doc = await ProductMatchupModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      productName: args.productName,
      productSegment: args.productSegment ?? null,
      productPositioning: args.productPositioning ?? null,
      productPricingModel: args.productPricingModel ?? null,
      productUrl: args.productUrl ?? null,
      competitorId: args.competitorId,
      competitorName: args.competitorName,
      competitorUrl: args.competitorUrl,
      goal: args.goal,
      targetSegment: args.targetSegment ?? null,
    });
    return doc.toJSON() as unknown as ProductMatchupResponse;
  },

  async findById(companyId: string, id: string): Promise<ProductMatchupResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await ProductMatchupModel.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!doc) return null;
    return doc.toJSON() as unknown as ProductMatchupResponse;
  },
};

