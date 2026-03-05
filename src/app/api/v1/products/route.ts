/** GET/POST /api/v1/products — list and create company-owned products. */

import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { authenticate } from "@/server/api/middleware/auth";
import { HttpError } from "@/server/api/errors";
import { companyProductService } from "@/server/services/company-product.service";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const products = await companyProductService.list(companyId);
    return apiSuccess(products);
  },
  { middleware: [authenticate] },
);

export const POST = withApiHandler(
  async (req: NextRequest) => {
    const companyId = req.headers.get("x-company-id") ?? "";
    if (!companyId) throw new HttpError(401, "No company id in request", "UNAUTHORIZED");

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      segment?: string | null;
      positioning?: string | null;
      pricingModel?: string | null;
      productUrl?: string | null;
    };
    if (!body.name) throw new HttpError(422, "name is required", "VALIDATION_ERROR");

    const created = await companyProductService.create(companyId, {
      name: body.name,
      segment: body.segment ?? null,
      positioning: body.positioning ?? null,
      pricingModel: body.pricingModel ?? null,
      productUrl: body.productUrl ?? null,
    });

    return apiSuccess(created, 201);
  },
  { middleware: [authenticate] },
);

