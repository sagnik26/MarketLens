/** DB queries for ComplianceSchedule; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import {
  ComplianceScheduleModel,
  toComplianceScheduleResponse,
  type ComplianceScheduleResponse,
  type IComplianceSchedule,
} from "@/server/models/ComplianceSchedule.model";

interface CreateArgs {
  companyId: string;
  complianceSourceId: string;
  cronExpression: string;
  isEnabled?: boolean;
}

interface UpdateArgs {
  cronExpression?: string;
  isEnabled?: boolean;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
}

interface LeanDoc {
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

export const complianceScheduleRepository = {
  async findMany(companyId: string): Promise<ComplianceScheduleResponse[]> {
    await dbConnect();
    const rows = await ComplianceScheduleModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<LeanDoc[]>();
    return rows.map((r) =>
      toComplianceScheduleResponse({
        ...r,
        complianceSourceId: r.complianceSourceId,
      } as IComplianceSchedule),
    );
  },

  async findById(companyId: string, id: string): Promise<ComplianceScheduleResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await ComplianceScheduleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean<LeanDoc | null>();
    if (!doc) return null;
    return toComplianceScheduleResponse(doc as unknown as IComplianceSchedule);
  },

  async create(args: CreateArgs): Promise<ComplianceScheduleResponse> {
    await dbConnect();
    const doc = await ComplianceScheduleModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      complianceSourceId: new mongoose.Types.ObjectId(args.complianceSourceId),
      cronExpression: args.cronExpression.trim(),
      isEnabled: args.isEnabled ?? false,
      lastRunAt: null,
      nextRunAt: null,
    });
    return toComplianceScheduleResponse(doc);
  },

  async update(
    companyId: string,
    id: string,
    args: UpdateArgs,
  ): Promise<ComplianceScheduleResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await ComplianceScheduleModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        companyId: new mongoose.Types.ObjectId(companyId),
      },
      { $set: args },
      { new: true, runValidators: true },
    ).lean<LeanDoc | null>();
    if (!doc) return null;
    return toComplianceScheduleResponse(doc as unknown as IComplianceSchedule);
  },

  async delete(companyId: string, id: string): Promise<boolean> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(companyId)) {
      return false;
    }
    const result = await ComplianceScheduleModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return result != null;
  },
};
