/** Mongoose CompanyProduct schema and model; a product owned by a company (tenant). */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICompanyProduct extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  segment?: string | null;
  positioning?: string | null;
  pricingModel?: string | null;
  productUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProductResponse {
  id: string;
  name: string;
  segment: string | null;
  positioning: string | null;
  pricingModel: string | null;
  productUrl: string | null;
  createdAt: string;
}

const companyProductSchema = new Schema<ICompanyProduct>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    segment: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    positioning: {
      type: String,
      default: null,
      trim: true,
      maxlength: 2000,
    },
    pricingModel: {
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        const out: CompanyProductResponse = {
          id: String(ret._id),
          name: String(ret.name),
          segment: ret.segment != null ? String(ret.segment) : null,
          positioning: ret.positioning != null ? String(ret.positioning) : null,
          pricingModel: ret.pricingModel != null ? String(ret.pricingModel) : null,
          productUrl: ret.productUrl != null ? String(ret.productUrl) : null,
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

companyProductSchema.index({ companyId: 1, createdAt: -1 });
companyProductSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const CompanyProductModel: Model<ICompanyProduct> =
  mongoose.models.CompanyProduct ??
  mongoose.model<ICompanyProduct>("CompanyProduct", companyProductSchema);

