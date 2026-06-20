import type { Memorial } from "@/lib/types";

function fmtDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export default function ServiceInfo({ memorial }: { memorial: Memorial }) {
  const s = memorial.serviceInfo;
  if (!s || (!s.date && !s.time && !s.location && !s.notes)) return null;

  return (
    <section id="service" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-white to-ink-50 shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-8 sm:p-10">
            <div className="divider mb-3 justify-start text-xs uppercase tracking-[0.25em]">
              Service details
            </div>
            <h2 className="font-serif text-3xl font-semibold text-ink-900">
              Honouring together
            </h2>
            <div className="mt-6 space-y-4 text-ink-600">
              {s.date && (
                <div className="flex gap-3">
                  <span className="text-candle-600">📅</span>
                  <span className="font-medium text-ink-800">
                    {fmtDate(s.date)}
                  </span>
                </div>
              )}
              {s.time && (
                <div className="flex gap-3">
                  <span className="text-candle-600">🕒</span>
                  <span>{s.time}</span>
                </div>
              )}
              {s.location && (
                <div className="flex gap-3">
                  <span className="text-candle-600">📍</span>
                  <span>{s.location}</span>
                </div>
              )}
              {s.notes && (
                <p className="pt-2 text-sm italic text-ink-500">{s.notes}</p>
              )}
            </div>
          </div>
          {memorial.livestreamUrl && (
            <div className="flex flex-col justify-center border-t border-ink-100 p-8 sm:p-10 md:border-l md:border-t-0">
              <span className="text-2xl">🎥</span>
              <h3 className="mt-3 font-serif text-xl font-semibold text-ink-900">
                Watch the livestream
              </h3>
              <p className="mt-2 text-sm text-ink-500">
                For those who cannot be with us in person.
              </p>
              <a
                href={memorial.livestreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block w-fit rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-ink-50 transition hover:bg-ink-800"
              >
                Join livestream
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
