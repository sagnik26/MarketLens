/** Mongoose Competitor schema and model; companyId index, isActive, timestamps. */

import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SourceChannel as SourceChannelType } from "@/constants";

export interface ICompetitor extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  website: string;
  logoUrl?: string | null;
  isActive: boolean;
  channels: SourceChannelType[];
  createdAt: Date;
  updatedAt: Date;
}

/** Plain shape safe to pass from Server Actions to Client Components (no ObjectId/Date instances). */
export interface CompetitorResponse {
  id: string;
  name: string;
  website: string;
  logoUrl: string | null;
  isActive: boolean;
  channels: SourceChannelType[];
  createdAt: string;
}

const competitorSchema = new Schema<ICompetitor>(
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
    website: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    channels: {
      type: [String],
      default: ["pricing"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        const out: CompetitorResponse = {
          id: String(ret._id),
          name: String(ret.name),
          website: String(ret.website),
          logoUrl: ret.logoUrl != null ? String(ret.logoUrl) : null,
          isActive: Boolean(ret.isActive),
          channels: Array.isArray(ret.channels)
            ? (ret.channels.map((c) => String(c)) as SourceChannelType[])
            : (["pricing"] as SourceChannelType[]),
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

competitorSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const CompetitorModel: Model<ICompetitor> =
  mongoose.models.Competitor ?? mongoose.model<ICompetitor>("Competitor", competitorSchema);

