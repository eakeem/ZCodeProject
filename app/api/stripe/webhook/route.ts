import { NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { setTenantTier } from "@/lib/repo";
import type { Tier } from "@/lib/types";

// POST /api/stripe/webhook — Stripe sends events here.
// Configure the webhook endpoint in your Stripe dashboard and set
// STRIPE_WEBHOOK_SECRET. On `checkout.session.completed` we upgrade
// the tenant to the tier stored in metadata.
//
// NOTE: this reads the raw body, which Next's app router provides via
// req.text() / req.body — do NOT parse as JSON before verifying.
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }
  const stripe = await getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature") || "";
  const payload = await req.text();

  let event;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event = await (stripe as any).webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const tenantId = session.client_reference_id || session.metadata?.tenantId;
    const tier = session.metadata?.tier as Tier | undefined;
    if (tenantId && tier) {
      await setTenantTier(tenantId, tier);
    }
  }

  return NextResponse.json({ received: true });
}
