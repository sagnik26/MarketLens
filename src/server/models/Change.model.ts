/** Mongoose Change schema and model; stores normalized signals produced by TinyFish scans. */

import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SourceChannel } from "@/constants";

export interface IChange extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  scanRunId?: mongoose.Types.ObjectId;
  competitorId: string;
  competitorName: string;
  changeType: string;
  signalType: string;
  priority: string;
  title: string;
  summary: string | null;
  detectedAt: Date;
  pageType?: SourceChannel;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const changeSchema = new Schema<IChange>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    scanRunId: {
      type: Schema.Types.ObjectId,
      ref: "ScanRun",
      index: true,
    },
    competitorId: {
      type: String,
      required: true,
      index: true,
    },
    competitorName: {
      type: String,
      required: true,
      trim: true,
    },
    changeType: {
      type: String,
      required: true,
      index: true,
    },
    signalType: {
      type: String,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: null,
    },
    detectedAt: {
      type: Date,
      required: true,
      index: true,
    },
    pageType: {
      type: String,
      default: null,
      index: true,
    },
    url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

changeSchema.index({ companyId: 1, detectedAt: -1 });

export const ChangeModel: Model<IChange> =
  mongoose.models.Change ?? mongoose.model<IChange>("Change", changeSchema);

