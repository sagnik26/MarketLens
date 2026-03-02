/** All DB queries for Competitor; always filter by companyId first. */

import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import { CompetitorModel, type CompetitorResponse } from "@/server/models/Competitor.model";

const COMPETITOR_PUBLIC_FIELDS = "name website logoUrl isActive channels createdAt";

function toPlainCompetitor(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  website: string;
  logoUrl?: string | null;
  isActive: boolean;
  channels?: string[];
  createdAt: Date;
}): CompetitorResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    website: doc.website,
    logoUrl: doc.logoUrl ?? null,
    isActive: doc.isActive,
    channels: Array.isArray(doc.channels) ? (doc.channels.map((c) => String(c)) as CompetitorResponse["channels"]) : (["pricing"] as CompetitorResponse["channels"]),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
  };
}

interface FindManyArgs {
  companyId: string;
  page?: number;
  limit?: number;
}

interface CreateArgs {
  companyId: string;
  name: string;
  website: string;
  logoUrl?: string | null;
  channels?: string[];
}

interface UpdateArgs {
  name?: string;
  website?: string;
  logoUrl?: string | null;
  isActive?: boolean;
}

export const competitorRepository = {
  async findMany({ companyId, page = 1, limit = 20 }: FindManyArgs) {
    await dbConnect();
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const filter = { companyId: new mongoose.Types.ObjectId(companyId) };

    const [rows, total] = await Promise.all([
      CompetitorModel.find(filter)
        .select(COMPETITOR_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      CompetitorModel.countDocuments(filter),
    ]);

    const competitors = rows.map((doc) => toPlainCompetitor({ ...doc, _id: doc._id }));
    return { competitors, total };
  },

  async findById(companyId: string, id: string): Promise<CompetitorResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await CompetitorModel.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .select(COMPETITOR_PUBLIC_FIELDS)
      .lean();
    return doc ? toPlainCompetitor(doc) : null;
  },

  async create({ companyId, name, website, logoUrl = null, channels }: CreateArgs): Promise<CompetitorResponse> {
    await dbConnect();
    const safeChannels = Array.isArray(channels) && channels.length ? channels : ["pricing"];
    const competitor = await CompetitorModel.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      name,
      website,
      logoUrl,
      channels: safeChannels,
    });
    return toPlainCompetitor(competitor);
  },

  async update(companyId: string, id: string, data: UpdateArgs): Promise<CompetitorResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await CompetitorModel.findOneAndUpdate(
      { _id: id, companyId: new mongoose.Types.ObjectId(companyId) },
      { $set: data },
      { new: true, runValidators: true },
    )
      .select(COMPETITOR_PUBLIC_FIELDS)
      .lean();
    return doc ? toPlainCompetitor(doc) : null;
  },

  async delete(companyId: string, id: string): Promise<boolean> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await CompetitorModel.findOneAndDelete({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    return res !== null;
  },
};

