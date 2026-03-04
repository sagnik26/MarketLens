/** Auth business logic: login, refresh, logout; issues and validates JWT, manages refresh tokens. */

import type { NextRequest } from "next/server";
import { userRepository } from "@/server/repositories/user.repository";
import { verifyPassword } from "@/server/lib/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/server/lib/auth/jwt";
import { HttpError } from "@/server/api/errors";

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new HttpError(403, "User is inactive", "USER_INACTIVE");
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      companyId: user.companyId.toString(),
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      sub: user._id.toString(),
      companyId: user.companyId.toString(),
    });

    await userRepository.updateRefreshToken(user._id.toString(), refreshToken);

    return {
      accessToken,
      refreshToken,
      userId: user._id.toString(),
      companyId: user.companyId.toString(),
      role: user.role,
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid refresh token", "INVALID_REFRESH");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  },

  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, null);
  },

  getUserFromRequest(req: NextRequest) {
    const token =
      req.cookies.get("access_token")?.value ??
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      "";

    if (!token) {
      throw new HttpError(401, "No access token provided", "UNAUTHORIZED");
    }

    return verifyAccessToken(token);
  },
};
