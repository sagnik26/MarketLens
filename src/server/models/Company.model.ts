/** Mongoose Company schema and model; root of multi-tenant data (id, name, plan). */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  plan: "starter" | "growth" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyResponse {
  id: string;
  name: string;
  plan: "starter" | "growth" | "enterprise";
  createdAt: string;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
      index: true,
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "enterprise"],
      default: "starter",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        const out: CompanyResponse = {
          id: String(ret._id),
          name: String(ret.name),
          plan:
            ret.plan === "growth" || ret.plan === "enterprise"
              ? ret.plan
              : "starter",
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

companySchema.index({ name: 1, plan: 1 });

export const CompanyModel: Model<ICompany> =
  mongoose.models.Company ?? mongoose.model<ICompany>("Company", companySchema);
