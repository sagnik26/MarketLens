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
  actions: IFlowAction[];
}

interface UpdateArgs {
  name?: string;
  isEnabled?: boolean;
  trigger?: IFlowTrigger;
  actions?: IFlowAction[];
}

interface FlowLeanDoc {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  isEnabled: boolean;
  trigger: IFlowTrigger;
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

  async create(args: CreateArgs): Promise<FlowResponse> {
    await dbConnect();
    const doc = await FlowModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      name: args.name,
      isEnabled: args.isEnabled ?? true,
      trigger: args.trigger,
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
    const doc = await FlowModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        companyId: new mongoose.Types.ObjectId(companyId),
      },
      { $set: args },
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
