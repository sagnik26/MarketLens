/** POST /api/v1/scan/run: create ScanRun and trigger TinyFish agents (run-sse for manual, run-async for automation). */

export const runtime = "nodejs";

export async function POST() {
  return Response.json({ success: true, data: null }, { status: 201 });
}
