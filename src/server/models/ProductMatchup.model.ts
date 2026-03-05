/** Mongoose ProductMatchup schema and model; product vs competitor matchup scoped to a company. */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProductMatchup extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;

  // Product snapshot (v1: embedded; later can be normalized into CompanyProduct)
  productName: string;
  productSegment?: string | null;
  productPositioning?: string | null;
  productPricingModel?: string | null;
  productUrl?: string | null;

  // Competitor target
  competitorId: string;
  competitorName: string;
  competitorUrl: string;

  // Matchup intent
  goal: string;
  targetSegment?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ProductMatchupResponse {
  id: string;
  productName: string;
  productSegment: string | null;
  productPositioning: string | null;
  productPricingModel: string | null;
  productUrl: string | null;
  competitorId: string;
  competitorName: string;
  competitorUrl: string;
  goal: string;
  targetSegment: string | null;
  createdAt: string;
}

const productMatchupSchema = new Schema<IProductMatchup>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    productSegment: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    productPositioning: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    productPricingModel: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    productUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },

    competitorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    competitorName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    competitorUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    goal: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    targetSegment: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        const out: ProductMatchupResponse = {
          id: String(ret._id),
          productName: String(ret.productName),
          productSegment: ret.productSegment != null ? String(ret.productSegment) : null,
          productPositioning: ret.productPositioning != null ? String(ret.productPositioning) : null,
          productPricingModel: ret.productPricingModel != null ? String(ret.productPricingModel) : null,
          productUrl: ret.productUrl != null ? String(ret.productUrl) : null,
          competitorId: String(ret.competitorId),
          competitorName: String(ret.competitorName),
          competitorUrl: String(ret.competitorUrl),
          goal: String(ret.goal),
          targetSegment: ret.targetSegment != null ? String(ret.targetSegment) : null,
          createdAt:
            ret.createdAt instanceof Date
              ? ret.createdAt.toISOString()
              : typeof ret.createdAt === "string"
                ? ret.createdAt
                : new Date().toISOString(),
        };
        return out;
      },
    },
  },
);

productMatchupSchema.index({ companyId: 1, createdAt: -1 });
productMatchupSchema.index({ companyId: 1, competitorId: 1 });

export const ProductMatchupModel: Model<IProductMatchup> =
  mongoose.models.ProductMatchup ??
  mongoose.model<IProductMatchup>("ProductMatchup", productMatchupSchema);

