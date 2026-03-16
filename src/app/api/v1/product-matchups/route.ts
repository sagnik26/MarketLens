/** GET/POST /api/v1/product-matchups — list and create product vs competitor matchups. */

import type { NextRequest } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { productMatchupService } from "@/server/services/product-matchup.service";

export const runtime = "nodejs";

const PRODUCT_MATCHUPS_CACHE_TAG = "product-matchups";
const PRODUCT_MATCHUPS_CACHE_REVALIDATE_SECONDS = 2 * 60; // 2 minutes

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const matchups = await unstable_cache(
      () => productMatchupService.list(companyId),
      [PRODUCT_MATCHUPS_CACHE_TAG, "list", companyId],
      {
        revalidate: PRODUCT_MATCHUPS_CACHE_REVALIDATE_SECONDS,
        tags: [PRODUCT_MATCHUPS_CACHE_TAG],
      },
    )();
    return apiSuccess(matchups);
  },
  { middleware: [authenticate] },
);

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const body = (await req.json().catch(() => ({}))) as {
      productName?: string;
      productSegment?: string | null;
      productPositioning?: string | null;
      productPricingModel?: string | null;
      productUrl?: string | null;
      competitorId?: string;
      competitorUrl?: string;
      goal?: string;
      targetSegment?: string | null;
    };

    if (!body.productName || !body.competitorId || !body.competitorUrl || !body.goal) {
      throw new HttpError(
        422,
        "productName, competitorId, competitorUrl, and goal are required",
        "VALIDATION_ERROR",
      );
    }

    const created = await productMatchupService.create(companyId, {
      productName: body.productName,
      productSegment: body.productSegment ?? null,
      productPositioning: body.productPositioning ?? null,
      productPricingModel: body.productPricingModel ?? null,
      productUrl: body.productUrl ?? null,
      competitorId: body.competitorId,
      competitorUrl: body.competitorUrl,
      goal: body.goal,
      targetSegment: body.targetSegment ?? null,
    });

    revalidateTag(PRODUCT_MATCHUPS_CACHE_TAG);
    return apiSuccess(created, 201);
  },
  { middleware: [authenticate] },
);

