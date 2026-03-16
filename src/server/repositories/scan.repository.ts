/** All DB queries for ScanRun: create and list recent runs per company. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import { ScanRunModel, type IScanRun } from "@/server/models/ScanRun.model";
import type { ScanRun } from "@/types";

interface CreateArgs {
  companyId: string;
  goalName: string;
  status: ScanRun["status"];
  startedAt: string;
  completedAt: string | null;
  totalSignals: number;
  totalInsights: number;
  totalCompetitors: number;
  errorMessage?: string;
}

interface FindManyArgs {
  companyId: string;
  page?: number;
  limit?: number;
  /** When set, only return runs with this goalName (e.g. compliance_radar_scan). */
  goalName?: string;
}

function toScanRun(doc: IScanRun): ScanRun {
  return {
    id: doc._id.toString(),
    tinyfishRunId: "",
    goalName: doc.goalName,
    status: doc.status,
    startedAt: doc.startedAt.toISOString(),
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    totalSignals: doc.totalSignals,
    totalInsights: doc.totalInsights,
    totalCompetitors: doc.totalCompetitors,
    errorMessage: doc.errorMessage ?? undefined,
  };
}

export const scanRepository = {
  async create(args: CreateArgs): Promise<ScanRun> {
    await dbConnect();
    const doc = await ScanRunModel.create({
      companyId: new mongoose.Types.ObjectId(args.companyId),
      goalName: args.goalName,
      status: args.status,
      startedAt: new Date(args.startedAt),
      ...(args.completedAt ? { completedAt: new Date(args.completedAt) } : {}),
      totalSignals: args.totalSignals,
      totalInsights: args.totalInsights,
      totalCompetitors: args.totalCompetitors,
      ...(args.errorMessage ? { errorMessage: args.errorMessage } : {}),
    });
    return toScanRun(doc);
  },

  async findMany({ companyId, page = 1, limit = 20, goalName }: FindManyArgs): Promise<{ scanRuns: ScanRun[]; total: number }> {
    await dbConnect();
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const filter: Record<string, unknown> = { companyId: new mongoose.Types.ObjectId(companyId) };
    if (goalName) filter.goalName = goalName;

    const [rows, total] = await Promise.all([
      ScanRunModel.find(filter)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean<IScanRun[]>(),
      ScanRunModel.countDocuments(filter),
    ]);

    const scanRuns = rows.map((doc) => toScanRun(doc as unknown as IScanRun));
    return { scanRuns, total };
  },
};

