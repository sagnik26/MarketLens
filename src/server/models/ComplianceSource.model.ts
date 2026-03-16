/** Mongoose ComplianceSource schema: regulatory source URL (e.g. BSE/NSE circulars) per company. */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IComplianceSource extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceSourceResponse {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const schema = new Schema<IComplianceSource>(
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
      minlength: 1,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

schema.index({ companyId: 1, isActive: 1 });

function toResponse(doc: IComplianceSource): ComplianceSourceResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    url: doc.url,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const ComplianceSourceModel: Model<IComplianceSource> =
  mongoose.models.ComplianceSource ??
  mongoose.model<IComplianceSource>("ComplianceSource", schema);

export function toComplianceSourceResponse(doc: IComplianceSource): ComplianceSourceResponse {
  return toResponse(doc);
}
