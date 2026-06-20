import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getStripeClient, isStripeConfigured, priceIdFor } from "@/lib/stripe";
import { setTenantTier } from "@/lib/repo";
import type { Tier } from "@/lib/types";

// POST /api/stripe/checkout  body: { tier }
// Creates a Stripe Checkout Session and returns its URL.
// If Stripe isn't configured, applies the tier directly (demo mode).
export async function POST(req: Request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { tier?: Tier };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const tier = body.tier;
  if (tier !== "free" && tier !== "essential" && tier !== "premium") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // free = downgrade immediately, no checkout
  if (tier === "free") {
    await setTenantTier(tenant.id, "free");
    return NextResponse.json({ ok: true, tier: "free" });
  }

  if (!isStripeConfigured()) {
    // demo mode — apply instantly so the flow can be exercised
    await setTenantTier(tenant.id, tier);
    return NextResponse.json({ ok: true, demo: true, tier }, { status: 202 });
  }

  const stripe = await getStripeClient();
  const priceId = priceIdFor(tier);
  if (!priceId) {
    return NextResponse.json({ error: "Price ID not set for that tier." }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (stripe as any).checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/admin/billing?upgrade=success`,
    cancel_url: `${origin}/admin/billing?upgrade=cancelled`,
    client_reference_id: tenant.id,
    metadata: { tenantId: tenant.id, tier },
  });

  return NextResponse.json({ url: session.url });
}
