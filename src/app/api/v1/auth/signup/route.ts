import type { NextRequest } from "next/server";
import { withApiHandler } from "@/server/api/route-handler";
import { apiSuccess } from "@/server/api/response";
import { HttpError } from "@/server/api/errors";
import { UserModel } from "@/server/models/User.model";
import { CompanyModel } from "@/server/models/Company.model";
import { hashPassword } from "@/server/lib/auth/password";
import { authService } from "@/server/services/auth.service";
import { dbConnect } from "@/server/lib/db";
import mongoose from "mongoose";

export const runtime = "nodejs";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
    companyName?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const password = body.password ?? "";
  const companyName = body.companyName?.trim();

  if (!email || !name || !password || !companyName) {
    throw new HttpError(
      422,
      "Email, name, password, and company name are required",
      "VALIDATION_ERROR",
    );
  }

  await dbConnect();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new HttpError(409, "User already exists", "CONFLICT");
  }

  const passwordHash = await hashPassword(password);

  // Create a new Company for this signup, then create the User as its admin.
  const company = await CompanyModel.create({
    name: companyName,
    plan: "starter",
  });

  await UserModel.create({
    companyId: company._id,
    email,
    name,
    password: passwordHash,
    role: "admin",
    isActive: true,
  });

  // Reuse login flow to issue cookies + tokens.
  const { accessToken, refreshToken, userId, companyId, role } = await authService.login(
    email,
    password,
  );

  const response = apiSuccess(
    {
      userId,
      companyId,
      role,
    },
    201,
  );

  response.headers.set(
    "Set-Cookie",
    [
      `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Secure`,
      `refresh_token=${refreshToken}; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Secure`,
    ].join(", "),
  );

  return response;
});

