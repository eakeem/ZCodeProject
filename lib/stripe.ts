// ============================================================
// Stripe helpers (tiered plans). The flow:
//   1. Tenant clicks "Upgrade" on /admin/billing
//   2. POST /api/stripe/checkout creates a Checkout Session for
//      the chosen tier's Price ID (read from env)
//   3. On success the tenant is redirected back; tier is upgraded
//   4. Stripe sends checkout.session.completed to
//      /api/stripe/webhook, which sets the tier durably.
//
// All Stripe calls happen server-side with the secret key.
// ============================================================

import type { Tier } from "./types";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

export function priceIdFor(tier: Tier): string | undefined {
  switch (tier) {
    case "free":
      return process.env.STRIPE_PRICE_FREE;
    case "essential":
      return process.env.STRIPE_PRICE_ESSENTIAL;
    case "premium":
      return process.env.STRIPE_PRICE_PREMIUM;
    default:
      return undefined;
  }
}

/**
 * Lazily create the Stripe client. Requires `stripe` to be
 * installed (`npm i stripe`) AND STRIPE_SECRET_KEY to be set.
 * Returns null otherwise so the UI can fall back to a
 * "demo mode" upgrade button.
 */
export async function getStripeClient(): Promise<unknown | null> {
  if (!isStripeConfigured()) return null;
  const key = process.env.STRIPE_SECRET_KEY!;
  // Dynamic require via a computed specifier so webpack does NOT try
  // to bundle the (optional) `stripe` dependency. This keeps stripe
  // truly optional — the app builds & runs without it installed.
  const moduleName = "stripe";
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
  const Stripe = (require(moduleName) as any).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}
