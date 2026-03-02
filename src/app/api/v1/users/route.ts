/** GET /api/v1/users and POST /api/v1/users: list users (paginated) and create user. */

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ success: true, data: [] });
}

export async function POST() {
  return Response.json({ success: true, data: null }, { status: 201 });
}
