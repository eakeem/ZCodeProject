import type { Memorial } from "@/lib/types";
import Candle from "@/components/Candle";

function fmt(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function Hero({ memorial }: { memorial: Memorial }) {
  const years =
    memorial.birthDate && memorial.passingDate
      ? `${fmt(memorial.birthDate)} — ${fmt(memorial.passingDate)}`
      : memorial.passingDate
        ? `Passed away ${fmt(memorial.passingDate)}`
        : "";

  return (
    <section id="top" className="relative">
      <div
        className="relative flex min-h-[70vh] items-center justify-center bg-cover bg-center text-center"
        style={{
          backgroundImage: memorial.heroImage
            ? `linear-gradient(rgba(20,18,16,0.5), rgba(20,18,16,0.75)), url(${memorial.heroImage})`
            : "linear-gradient(135deg, #332f28, #1f1c18)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 py-24 text-ink-50">
          <div className="mb-6 flex justify-center">
            <Candle size={44} />
          </div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-candle-200">
            In loving memory
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            {memorial.deceasedName}
          </h1>
          {years && (
            <p className="mt-4 text-lg italic text-ink-200">{years}</p>
          )}
          {memorial.tagline && (
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-100">
              {memorial.tagline}
            </p>
          )}
          <div className="mt-10">
            <a
              href="#tributes"
              className="inline-block rounded-full bg-candle-500 px-7 py-3 text-sm font-medium text-white transition hover:bg-candle-600"
            >
              Leave a tribute
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
