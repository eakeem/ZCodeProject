import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Candle from "@/components/Candle";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(31,28,24,0.55), rgba(31,28,24,0.7)), url('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-32 text-center text-ink-50 sm:py-44">
            <div className="mb-6 animate-fadeIn">
              <Candle size={48} />
            </div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-candle-200">
              Celebrating lives, together
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
              A beautiful place to remember
              <br />
              the people you love.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-100">
              Create lasting memories. Gather photos,
              receive warm tributes, and light virtual candles. A space
              where family and friends can gather, no matter the distance.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="mailto:Memforial@gmail.com"
                className="rounded-full bg-candle-500 px-8 py-3.5 font-medium text-white shadow-lg transition hover:bg-candle-600"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-14 text-center">
            <div className="divider mb-4 text-xs uppercase tracking-[0.25em]">
              Everything in one place
            </div>
            <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
              Thoughtful features for remembrance
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🖼️",
                title: "A gallery of memories",
                body: "Upload photographs that tell the story of a life, arranged in a beautiful, responsive gallery.",
              },
              {
                icon: "✉️",
                title: "Tributes & Shared photos",
                body: "Friends and family can leave warm messages of support. Every tribute is moderated by us before it appears.",
              },
              {
                icon: "🕯️",
                title: "Light a candle",
                body: "A timeless gesture of remembrance. Visitors light virtual candles that glow on the memorial page.",
              },
              {
                icon: "✍️",
                title: "Your words, your way",
                body: "biography, favourite quotes, and service details with custom, editable text sections.",
              },
              {
                icon: "🔒",
                title: "You're in control",
                body: "Approve or remove tributes, edit content anytime, and decide exactly what the world sees.",
              },
              {
                icon: "📱",
                title: "Beautiful on every device",
                body: "Every memorial is fully responsive — graceful on phones, tablets, and large screens alike.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="lift rounded-2xl border border-ink-100 bg-white p-7 shadow-sm"
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="font-serif text-xl font-semibold text-ink-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how" className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <div className="mb-14 text-center">
              <div className="divider mb-4 text-xs uppercase tracking-[0.25em]">
                Simple to set up
              </div>
              <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
                We handle the tech, you focus on the memories
              </h2>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "Create your account",
                  b: "Contact our team to start a memorial in minutes. Send us your details and we do the heavy lifting.",
                },
                {
                  n: "2",
                  t: "Personalise webpage",
                  b: "High quality photos, full funeral program, all in one for all your needs.",
                },
                {
                  n: "3",
                  t: "Share & gather",
                  b: "Share the link. Visitors leave tributes and light candles all moderated by us.",
                },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-candle-100 font-serif text-2xl font-semibold text-candle-700">
                    {s.n}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-ink-900">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm text-ink-500">{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 to-ink-900 px-8 py-16 text-center text-ink-50">
            <Candle size={40} />
            <h2 className="mt-6 font-serif text-3xl font-semibold sm:text-4xl">
              Begin a memorial today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-200">
              For all your funeral website needs. Contact our team to get started. We have different packages available to suit your needs. We will handle the tech, you focus on the memories.
            </p>
            <Link
              href="mailto:Memforial@gmail.com"
              className="mt-8 inline-block rounded-full bg-candle-500 px-8 py-3.5 font-medium text-white transition hover:bg-candle-600"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
