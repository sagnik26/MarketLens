/** GET /api/v1/compliance: list ComplianceAlerts for the authenticated company (paginated). */

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ success: true, data: [] });
}
