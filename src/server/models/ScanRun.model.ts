/** Mongoose ScanRun schema and model; stores high-level scan metadata used by Status and analytics. */

import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ScanRunStatus } from "@/types";

export interface IScanRun extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  goalName: string;
  status: ScanRunStatus;
  startedAt: Date;
  completedAt: Date | null;
  totalSignals: number;
  totalInsights: number;
  totalCompetitors: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanRunSchema = new Schema<IScanRun>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    goalName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    totalSignals: {
      type: Number,
      default: 0,
    },
    totalInsights: {
      type: Number,
      default: 0,
    },
    totalCompetitors: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

scanRunSchema.index({ companyId: 1, startedAt: -1 });

export const ScanRunModel: Model<IScanRun> =
  mongoose.models.ScanRun ?? mongoose.model<IScanRun>("ScanRun", scanRunSchema);

