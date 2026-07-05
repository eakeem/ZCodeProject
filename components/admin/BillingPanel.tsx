"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tier } from "@/lib/types";

export default function BillingPanel({
  currentTier,
  configured,
}: {
  currentTier: Tier;
  configured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Tier | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function upgrade(tier: Tier) {
    setBusy(tier);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.status === 202) {
        // Stripe not configured — demo-mode upgrade applied directly
        setMsg(`Upgraded to ${tier} (demo mode — Stripe not configured).`);
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not start checkout.");
      // redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {!configured && (
        <div className="rounded-lg bg-candle-50 px-4 py-3 text-sm text-candle-800">
          <strong>Choose plan:</strong>so upgrades are
          applied instantly, depending on customer payment.
          <code className="mx-1 rounded bg-white/60 px-1">.env.local</code>
          to take real payments.
        </div>
      )}
      {msg && (
        <div className="rounded-lg bg-sage-50 px-4 py-2.5 text-sm text-sage-700">
          {msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {(["free", "essential", "premium"] as Tier[]).map((t) => {
          const isCurrent = currentTier === t;
          return (
            <div
              key={t}
              className={`rounded-2xl border bg-white p-6 ${
                isCurrent ? "border-sage-400" : "border-ink-100"
              }`}
            >
              <p className="font-serif text-xl font-semibold capitalize text-ink-900">
                {t}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t === "free" && "6 photos, basic memorial"}
                {t === "essential" && "50 photos, livestream, custom text"}
                {t === "premium" && "Unlimited, custom domain, no branding"}
              </p>
              {isCurrent ? (
                <span className="mt-4 inline-block rounded-full bg-sage-100 px-4 py-2 text-sm font-medium text-sage-700">
                  Your current plan
                </span>
              ) : (
                <button
                  onClick={() => upgrade(t)}
                  disabled={busy !== null}
                  className="mt-4 w-full rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
                >
                  {busy === t ? "Please wait..." : t === "free" ? "Downgrade" : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
