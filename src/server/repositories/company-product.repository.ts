/** All DB queries for CompanyProduct; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import {
  CompanyProductModel,
  type CompanyProductResponse,
} from "@/server/models/CompanyProduct.model";

interface CreateArgs {
  companyId: string;
  name: string;
  segment?: string | null;
  positioning?: string | null;
  pricingModel?: string | null;
  productUrl?: string | null;
}

interface CompanyProductLeanDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  segment?: string | null;
  positioning?: string | null;
  pricingModel?: string | null;
  productUrl?: string | null;
  createdAt: Date;
}

function toResponse(doc: CompanyProductLeanDoc): CompanyProductResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    segment: doc.segment ?? null,
    positioning: doc.positioning ?? null,
    pricingModel: doc.pricingModel ?? null,
    productUrl: doc.productUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const companyProductRepository = {
  async findMany(companyId: string): Promise<CompanyProductResponse[]> {
    await dbConnect();
    const rows = await CompanyProductModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<CompanyProductLeanDoc[]>();

    return rows.map(toResponse);
  },

  async create(args: CreateArgs): Promise<CompanyProductResponse> {
    await dbConnect();
    const doc = await CompanyProductModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      name: args.name,
      segment: args.segment ?? null,
      positioning: args.positioning ?? null,
      pricingModel: args.pricingModel ?? null,
      productUrl: args.productUrl ?? null,
    });
    return doc.toJSON() as unknown as CompanyProductResponse;
  },
};

