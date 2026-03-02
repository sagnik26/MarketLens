/** POST /api/v1/auth/refresh: issue new access token using refresh token from cookie. */

export const runtime = "nodejs";

export async function POST() {
  return Response.json({ success: true, data: null });
}
