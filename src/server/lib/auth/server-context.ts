import { cookies } from "next/headers";
import {
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/server/lib/auth/jwt";
import { HttpError } from "@/server/api/errors";

export interface ServerAuthContext {
  userId: string;
  companyId: string;
  role: string;
}

export async function getServerAuthContext(): Promise<ServerAuthContext> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value ?? "";

  if (!accessToken) {
    throw new HttpError(401, "No access token provided", "UNAUTHORIZED");
  }

  const payload = verifyAccessToken(accessToken);

  return {
    userId: payload.sub,
    companyId: payload.companyId,
    role: payload.role,
  };
}
