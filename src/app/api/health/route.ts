/** Health check endpoint for uptime monitoring; returns status and version. */

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ success: true, data: { status: "ok" } });
}
