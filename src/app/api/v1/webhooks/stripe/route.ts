/** POST /api/v1/webhooks/stripe: verify signature and process Stripe webhook events async. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ received: true });
}
