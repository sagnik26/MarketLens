import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/server/api/errors";

export interface JwtPayload {
  sub: string; // user id
  companyId: string;
  role: string;
}

function getAccessSecret(): string {
  if (env.JWT_ACCESS_SECRET) return env.JWT_ACCESS_SECRET;
  // Safe fallback for local development/test; production must set real secrets.
  return "dev-access-secret-please-set-JWT_ACCESS_SECRET-in-env-xxxxxxxx";
}

function getRefreshSecret(): string {
  if (env.JWT_REFRESH_SECRET) return env.JWT_REFRESH_SECRET;
  return "dev-refresh-secret-please-set-JWT_REFRESH_SECRET-in-env-yyyyyyyy";
}

function getAccessExpiresIn(): string {
  // Default to 15 minutes if not configured.
  return env.JWT_ACCESS_EXPIRES_IN && env.JWT_ACCESS_EXPIRES_IN.trim().length > 0
    ? env.JWT_ACCESS_EXPIRES_IN
    : "15m";
}

function getRefreshExpiresIn(): string {
  // Default to 7 days if not configured.
  return env.JWT_REFRESH_EXPIRES_IN && env.JWT_REFRESH_EXPIRES_IN.trim().length > 0
    ? env.JWT_REFRESH_EXPIRES_IN
    : "7d";
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: getAccessExpiresIn() as any };
  return jwt.sign(payload, getAccessSecret(), options);
}

export function signRefreshToken(payload: Pick<JwtPayload, "sub" | "companyId">): string {
  const options: SignOptions = { expiresIn: getRefreshExpiresIn() as any };
  return jwt.sign(payload, getRefreshSecret(), options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getAccessSecret()) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired access token", "UNAUTHORIZED");
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getRefreshSecret()) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token", "UNAUTHORIZED");
  }
}

