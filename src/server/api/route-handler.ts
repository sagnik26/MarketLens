/** Wraps route handlers with consistent error catching, logging, and middleware execution. */

import type { NextRequest } from "next/server";
import { HttpError } from "@/server/api/errors";
import { apiError } from "@/server/api/response";
import { logger } from "@/server/lib/logger";

type Middleware = (req: NextRequest) => Promise<void>;

interface HandlerOptions {
  middleware?: Middleware[];
}

export function withApiHandler(
  handler: (req: NextRequest, ctx: any) => Promise<Response>,
  options: HandlerOptions = {},
) {
  return async (req: NextRequest, ctx: any): Promise<Response> => {
    const requestId = crypto.randomUUID();

    try {
      for (const mw of options.middleware ?? []) {
        await mw(req);
      }

      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        (logger as any).warn(
          { requestId, status: error.statusCode, message: error.message },
          "HTTP error in route handler",
        );
        return apiError(error.message, error.statusCode, error.code);
      }

      (logger as any).error({ requestId, error }, "Unhandled error in route handler");
      return apiError("Internal Server Error", 500, "INTERNAL_ERROR");
    }
  };
}

