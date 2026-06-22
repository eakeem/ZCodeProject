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
 *
 * The dynamic import is created via `new Function`, whose body
 * bundlers (webpack AND Turbopack) cannot statically analyse — so
 * the optional `stripe` dependency is never resolved at build time.
 * Stripe stays truly optional: the app builds & runs without it
 * installed; it's only resolved at runtime when actually used.
 */
const importDynamic = new Function(
  "specifier",
  "return import(specifier)",
) as (s: string) => Promise<Record<string, unknown> & { default?: unknown }>;

export async function getStripeClient(): Promise<unknown | null> {
  if (!isStripeConfigured()) return null;
  const key = process.env.STRIPE_SECRET_KEY!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await importDynamic("stripe")) as any;
  const Stripe = mod.default ?? mod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}
