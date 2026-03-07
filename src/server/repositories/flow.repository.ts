/** All DB queries for Flow; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import {
  FlowModel,
  type FlowResponse,
  type IFlowAction,
  type IFlowTrigger,
} from "@/server/models/Flow.model";

interface CreateArgs {
  companyId: string;
  name: string;
  isEnabled?: boolean;
  trigger: IFlowTrigger;
  competitorId?: string | null;
  complianceSourceId?: string | null;
  matchupId?: string | null;
  actions: IFlowAction[];
}

interface UpdateArgs {
  name?: string;
  isEnabled?: boolean;
  trigger?: IFlowTrigger;
  competitorId?: string | null;
  complianceSourceId?: string | null;
  matchupId?: string | null;
  actions?: IFlowAction[];
}

interface FlowLeanDoc {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  isEnabled: boolean;
  trigger: IFlowTrigger;
  competitorId: mongoose.Types.ObjectId | null;
  complianceSourceId: mongoose.Types.ObjectId | null;
  matchupId: mongoose.Types.ObjectId | null;
  actions: IFlowAction[];
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: FlowLeanDoc): FlowResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    isEnabled: doc.isEnabled,
    trigger: doc.trigger,
    competitorId: doc.competitorId ? doc.competitorId.toString() : null,
    complianceSourceId: doc.complianceSourceId ? doc.complianceSourceId.toString() : null,
    matchupId: doc.matchupId ? doc.matchupId.toString() : null,
    actions: doc.actions.map((a) => ({
      ...a,
      headers: a.headers ?? undefined,
      label: a.label ?? undefined,
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const flowRepository = {
  async findMany(companyId: string): Promise<FlowResponse[]> {
    await dbConnect();
    const rows = await FlowModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  async findById(companyId: string, id: string): Promise<FlowResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await FlowModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean<FlowLeanDoc | null>();
    if (!doc) return null;
    return toResponse(doc);
  },

  async findManyByEventType(
    companyId: string,
    eventType: string,
  ): Promise<FlowResponse[]> {
    await dbConnect();
    const rows = await FlowModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      isEnabled: true,
      "trigger.eventType": eventType,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  /** For change_created / insight_created (competitor): flows scoped to competitors (matchupId null). */
  async findManyForCompetitorEvent(
    companyId: string,
    eventType: string,
    competitorId: string,
  ): Promise<FlowResponse[]> {
    await dbConnect();
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const competitorOid = new mongoose.Types.ObjectId(competitorId);
    const rows = await FlowModel.find({
      companyId: companyOid,
      isEnabled: true,
      matchupId: null,
      "trigger.eventType": eventType,
      $or: [{ competitorId: null }, { competitorId: competitorOid }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  /** For scan_completed (competitor): flows scoped to competitors (matchupId null). */
  async findManyForCompetitorScan(
    companyId: string,
    competitorIds: string[],
  ): Promise<FlowResponse[]> {
    await dbConnect();
    if (competitorIds.length === 0) {
      const rows = await FlowModel.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        isEnabled: true,
        matchupId: null,
        "trigger.eventType": "scan_completed",
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean<FlowLeanDoc[]>();
      return rows.map(toResponse);
    }
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const competitorOids = competitorIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const rows = await FlowModel.find({
      companyId: companyOid,
      isEnabled: true,
      matchupId: null,
      "trigger.eventType": "scan_completed",
      $or: [
        { competitorId: null },
        { competitorId: { $in: competitorOids } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  /** For compliance_scan_completed: flows that apply to this source (or all sources if complianceSourceId null). */
  async findManyForComplianceScan(
    companyId: string,
    sourceId: string,
  ): Promise<FlowResponse[]> {
    await dbConnect();
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const sourceOid = new mongoose.Types.ObjectId(sourceId);
    const rows = await FlowModel.find({
      companyId: companyOid,
      isEnabled: true,
      "trigger.eventType": "compliance_scan_completed",
      $or: [
        { complianceSourceId: null },
        { complianceSourceId: sourceOid },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  /** For change_created / insight_created (matchup): flows scoped to matchups (competitorId null). */
  async findManyForMatchupEvent(
    companyId: string,
    eventType: string,
    matchupId: string,
  ): Promise<FlowResponse[]> {
    await dbConnect();
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const matchupOid = new mongoose.Types.ObjectId(matchupId);
    const rows = await FlowModel.find({
      companyId: companyOid,
      isEnabled: true,
      competitorId: null,
      "trigger.eventType": eventType,
      $or: [{ matchupId: null }, { matchupId: matchupOid }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  /** For scan_completed (matchup): flows scoped to matchups (competitorId null). */
  async findManyForMatchupScan(
    companyId: string,
    matchupIds: string[],
  ): Promise<FlowResponse[]> {
    await dbConnect();
    if (matchupIds.length === 0) {
      const rows = await FlowModel.find({
        companyId: new mongoose.Types.ObjectId(companyId),
        isEnabled: true,
        competitorId: null,
        "trigger.eventType": "scan_completed",
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean<FlowLeanDoc[]>();
      return rows.map(toResponse);
    }
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const matchupOids = matchupIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const rows = await FlowModel.find({
      companyId: companyOid,
      isEnabled: true,
      competitorId: null,
      "trigger.eventType": "scan_completed",
      $or: [{ matchupId: null }, { matchupId: { $in: matchupOids } }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<FlowLeanDoc[]>();
    return rows.map(toResponse);
  },

  async create(args: CreateArgs): Promise<FlowResponse> {
    await dbConnect();
    const doc = await FlowModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      name: args.name,
      isEnabled: args.isEnabled ?? true,
      trigger: args.trigger,
      competitorId:
        args.competitorId != null && args.competitorId !== ""
          ? new mongoose.Types.ObjectId(args.competitorId)
          : null,
      complianceSourceId:
        args.complianceSourceId != null && args.complianceSourceId !== ""
          ? new mongoose.Types.ObjectId(args.complianceSourceId)
          : null,
      matchupId:
        args.matchupId != null && args.matchupId !== ""
          ? new mongoose.Types.ObjectId(args.matchupId)
          : null,
      actions: args.actions,
    });
    return doc.toJSON() as unknown as FlowResponse;
  },

  async update(
    companyId: string,
    id: string,
    args: UpdateArgs,
  ): Promise<FlowResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const set: Record<string, unknown> = { ...args };
    if (args.competitorId !== undefined) {
      set.competitorId =
        args.competitorId != null && args.competitorId !== ""
          ? new mongoose.Types.ObjectId(args.competitorId)
          : null;
    }
    if (args.complianceSourceId !== undefined) {
      set.complianceSourceId =
        args.complianceSourceId != null && args.complianceSourceId !== ""
          ? new mongoose.Types.ObjectId(args.complianceSourceId)
          : null;
    }
    if (args.matchupId !== undefined) {
      set.matchupId =
        args.matchupId != null && args.matchupId !== ""
          ? new mongoose.Types.ObjectId(args.matchupId)
          : null;
    }
    const doc = await FlowModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        companyId: new mongoose.Types.ObjectId(companyId),
      },
      { $set: set },
      { new: true, runValidators: true },
    ).lean<FlowLeanDoc | null>();
    if (!doc) return null;
    return toResponse(doc);
  },

  async delete(companyId: string, id: string): Promise<boolean> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(companyId)) {
      return false;
    }
    const result = await FlowModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return result != null;
  },
};
