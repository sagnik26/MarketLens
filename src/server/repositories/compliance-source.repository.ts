/** DB queries for ComplianceSource; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import {
  ComplianceSourceModel,
  toComplianceSourceResponse,
  type ComplianceSourceResponse,
  type IComplianceSource,
} from "@/server/models/ComplianceSource.model";

export const complianceSourceRepository = {
  async findMany(companyId: string): Promise<ComplianceSourceResponse[]> {
    await dbConnect();
    const rows = await ComplianceSourceModel.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<IComplianceSource[]>();
    return rows.map((r) => toComplianceSourceResponse(r as IComplianceSource));
  },

  async findById(companyId: string, id: string): Promise<ComplianceSourceResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await ComplianceSourceModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean<IComplianceSource | null>();
    if (!doc) return null;
    return toComplianceSourceResponse(doc as IComplianceSource);
  },

  async create(
    companyId: string,
    data: { name: string; url: string },
  ): Promise<ComplianceSourceResponse> {
    await dbConnect();
    const doc = await ComplianceSourceModel.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      name: data.name.trim(),
      url: data.url.trim(),
      isActive: true,
    });
    return toComplianceSourceResponse(doc);
  },

  async delete(companyId: string, id: string): Promise<boolean> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(companyId)) {
      return false;
    }
    const result = await ComplianceSourceModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return result != null;
  },
};
