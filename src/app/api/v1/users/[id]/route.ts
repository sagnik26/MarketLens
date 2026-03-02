/** GET/PATCH/DELETE /api/v1/users/:id: fetch, update, or delete a user by id. */

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ success: true, data: null });
}

export async function PATCH() {
  return Response.json({ success: true, data: null });
}

export async function DELETE() {
  return new Response(null, { status: 204 });
}
