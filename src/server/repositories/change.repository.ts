/** All DB queries for Change documents (normalized signals) per company and channel. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import { ChangeModel, type IChange } from "@/server/models/Change.model";
import type { BackendChange } from "@/types";
import type { SourceChannel } from "@/constants";

interface CreateManyArgs {
  companyId: string;
  scanRunId: string;
  changes: BackendChange[];
}

interface FindRecentArgs {
  companyId: string;
  limit?: number;
  pageType?: SourceChannel;
}

interface FindByCompetitorArgs {
  companyId: string;
  competitorId: string;
  limit?: number;
  pageType?: SourceChannel;
}

function toBackendChange(doc: IChange): BackendChange {
  return {
    id: doc._id.toString(),
    competitorId: doc.competitorId,
    competitorName: doc.competitorName,
    changeType: doc.changeType,
    signalType: doc.signalType,
    priority: doc.priority,
    title: doc.title,
    summary: doc.summary ?? null,
    isRead: false,
    isDismissed: false,
    detectedAt: doc.detectedAt.toISOString(),
    pageType: doc.pageType,
    url: doc.url,
  };
}

export const changeRepository = {
  async createMany({ companyId, scanRunId, changes }: CreateManyArgs): Promise<void> {
    if (!changes.length) return;
    await dbConnect();
    const docs = changes.map((chg) => ({
      companyId: new mongoose.Types.ObjectId(companyId),
      scanRunId: new mongoose.Types.ObjectId(scanRunId),
      competitorId: chg.competitorId,
      competitorName: chg.competitorName,
      changeType: chg.changeType,
      signalType: chg.signalType,
      priority: chg.priority,
      title: chg.title,
      summary: chg.summary ?? null,
      detectedAt: new Date(chg.detectedAt),
      pageType: chg.pageType ?? null,
      url: chg.url ?? null,
    }));
    await ChangeModel.insertMany(docs);
  },

  async findRecentByCompany({ companyId, limit = 200, pageType }: FindRecentArgs): Promise<BackendChange[]> {
    await dbConnect();
    const safeLimit = Math.min(limit, 500);
    const filter: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
    };
    if (pageType) {
      filter.pageType = pageType;
    }

    const rows = await ChangeModel.find(filter)
      .sort({ detectedAt: -1 })
      .limit(safeLimit)
      .lean<IChange[]>();

    return rows.map((doc) => toBackendChange(doc as unknown as IChange));
  },

  async findByCompetitor({
    companyId,
    competitorId,
    limit = 200,
    pageType,
  }: FindByCompetitorArgs): Promise<BackendChange[]> {
    await dbConnect();
    const safeLimit = Math.min(limit, 500);
    const filter: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      competitorId,
    };
    if (pageType) {
      filter.pageType = pageType;
    }

    const rows = await ChangeModel.find(filter)
      .sort({ detectedAt: -1 })
      .limit(safeLimit)
      .lean<IChange[]>();

    return rows.map((doc) => toBackendChange(doc as unknown as IChange));
  },
};

