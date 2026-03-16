/** Mongoose Flow schema and model; automation flow (trigger + webhook actions) for n8n/webhooks. */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export const FlowTriggerEventType = {
  CHANGE_CREATED: "change_created",
  INSIGHT_CREATED: "insight_created",
  SCAN_COMPLETED: "scan_completed",
  COMPLIANCE_SCAN_COMPLETED: "compliance_scan_completed",
} as const;
export type FlowTriggerEventType =
  (typeof FlowTriggerEventType)[keyof typeof FlowTriggerEventType];

export interface IFlowAction {
  type: "webhook" | "slack";
  url: string;
  method?: string;
  headers?: Record<string, string>;
  label?: string;
}

export interface IFlowTrigger {
  eventType: FlowTriggerEventType;
}

export interface IFlow extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  isEnabled: boolean;
  trigger: IFlowTrigger;
  /** When set, this flow only runs for this competitor (for change_created, insight_created, scan_completed). Null = all competitors. */
  competitorId: mongoose.Types.ObjectId | null;
  /** When set, this flow only runs for this compliance source (for compliance_scan_completed). Null = all sources. */
  complianceSourceId: mongoose.Types.ObjectId | null;
  /** When set, this flow only runs for this product matchup (for change_created, insight_created, scan_completed from matchup scans). Null = all matchups. */
  matchupId: mongoose.Types.ObjectId | null;
  actions: IFlowAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowResponse {
  id: string;
  name: string;
  isEnabled: boolean;
  trigger: IFlowTrigger;
  competitorId: string | null;
  complianceSourceId: string | null;
  matchupId: string | null;
  actions: IFlowAction[];
  createdAt: string;
  updatedAt: string;
}

const flowActionSchema = new Schema<IFlowAction>(
  {
    type: {
      type: String,
      required: true,
      enum: ["webhook", "slack"],
      default: "webhook",
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    method: {
      type: String,
      default: "POST",
      trim: true,
      maxlength: 10,
    },
    headers: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    label: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false },
);

const flowTriggerSchema = new Schema<IFlowTrigger>(
  {
    eventType: {
      type: String,
      required: true,
      enum: Object.values(FlowTriggerEventType),
    },
  },
  { _id: false },
);

const flowSchema = new Schema<IFlow>(
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
    isEnabled: {
      type: Boolean,
      default: true,
    },
    trigger: {
      type: flowTriggerSchema,
      required: true,
    },
    competitorId: {
      type: Schema.Types.ObjectId,
      ref: "Competitor",
      default: null,
      index: true,
    },
    complianceSourceId: {
      type: Schema.Types.ObjectId,
      ref: "ComplianceSource",
      default: null,
      index: true,
    },
    matchupId: {
      type: Schema.Types.ObjectId,
      ref: "ProductMatchup",
      default: null,
      index: true,
    },
    actions: {
      type: [flowActionSchema],
      required: true,
      default: [],
      validate: {
        validator: (v: IFlowAction[]) => Array.isArray(v) && v.length > 0,
        message: "At least one action is required",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        const out: FlowResponse = {
          id: String(ret._id),
          name: String(ret.name),
          isEnabled: Boolean(ret.isEnabled),
          trigger: ret.trigger as IFlowTrigger,
          competitorId: ret.competitorId ? String(ret.competitorId) : null,
          complianceSourceId: ret.complianceSourceId
            ? String(ret.complianceSourceId)
            : null,
          matchupId: ret.matchupId ? String(ret.matchupId) : null,
          actions: (ret.actions as IFlowAction[]).map((a) => ({
            ...a,
            headers: a.headers ?? undefined,
            label: a.label ?? undefined,
          })),
          createdAt:
            ret.createdAt instanceof Date
              ? ret.createdAt.toISOString()
              : typeof ret.createdAt === "string"
                ? ret.createdAt
                : new Date().toISOString(),
          updatedAt:
            ret.updatedAt instanceof Date
              ? ret.updatedAt.toISOString()
              : typeof ret.updatedAt === "string"
                ? ret.updatedAt
                : new Date().toISOString(),
        };
        return out;
      },
    },
  },
);

flowSchema.index({ companyId: 1, createdAt: -1 });

export const FlowModel: Model<IFlow> =
  mongoose.models.Flow ?? mongoose.model<IFlow>("Flow", flowSchema);
