/** Mongoose ComplianceSchedule schema: scheduled compliance scans (cron); alerts required when enabled. */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IComplianceSchedule extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  complianceSourceId: mongoose.Types.ObjectId;
  cronExpression: string;
  isEnabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceScheduleResponse {
  id: string;
  complianceSourceId: string;
  cronExpression: string;
  isEnabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const schema = new Schema<IComplianceSchedule>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    complianceSourceId: {
      type: Schema.Types.ObjectId,
      ref: "ComplianceSource",
      required: true,
      index: true,
    },
    cronExpression: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ companyId: 1, isEnabled: 1 });

function toResponse(doc: IComplianceSchedule): ComplianceScheduleResponse {
  return {
    id: doc._id.toString(),
    complianceSourceId: doc.complianceSourceId.toString(),
    cronExpression: doc.cronExpression,
    isEnabled: doc.isEnabled,
    lastRunAt: doc.lastRunAt ? doc.lastRunAt.toISOString() : null,
    nextRunAt: doc.nextRunAt ? doc.nextRunAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const ComplianceScheduleModel: Model<IComplianceSchedule> =
  mongoose.models.ComplianceSchedule ??
  mongoose.model<IComplianceSchedule>("ComplianceSchedule", schema);

export function toComplianceScheduleResponse(doc: IComplianceSchedule): ComplianceScheduleResponse {
  return toResponse(doc);
}
