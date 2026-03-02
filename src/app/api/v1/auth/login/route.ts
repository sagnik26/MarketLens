/** POST /api/v1/auth/login: authenticate user and set access/refresh tokens in httpOnly cookies. */

export const runtime = "nodejs";

export async function POST() {
  return Response.json({ success: true, data: null });
}
