import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { TIERS, TIER_ORDER } from "@/lib/tiers";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-14 text-center">
          <div className="divider mb-4 text-xs uppercase tracking-[0.25em]">
            Simple, honest pricing
          </div>
          <h1 className="font-serif text-4xl font-semibold text-ink-900 sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            We have different packages available to suit your needs. We will handle the tech, you focus on the memories.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIER_ORDER.map((id) => {
            const t = TIERS[id];
            const featured = id === "essential";
            return (
              <div
                key={id}
                className={`relative flex flex-col rounded-3xl border bg-white p-8 ${
                  featured ? "border-candle-300 shadow-lg lg:-mt-4 lg:mb-4" : "border-ink-100"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-candle-500 px-4 py-1 text-xs font-medium uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h2 className="font-serif text-2xl font-semibold text-ink-900">{t.name}</h2>
                <p className="mt-1 text-sm text-ink-500">{t.description}</p>
                <div className="mt-5">
                  <span className="font-serif text-4xl font-semibold text-ink-900">
                    ${t.priceMonthly}
                  </span>
                  <span className="text-ink-400">USD</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-ink-600">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-sage-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-medium transition ${
                    featured
                      ? "bg-candle-500 text-white hover:bg-candle-600"
                      : "bg-ink-900 text-ink-50 hover:bg-ink-800"
                  }`}
                >
                  Admin login
                </Link>
              </div>
            );
          })}
        </div>

        
      </main>
      <SiteFooter />
    </>
  );
}
