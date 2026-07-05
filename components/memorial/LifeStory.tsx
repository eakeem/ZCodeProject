import type { Memorial } from "@/lib/types";
import type { MediaItem } from "@/lib/types";

export default function LifeStory({
  memorial,
  portrait,
}: {
  memorial: Memorial;
  portrait?: MediaItem;
}) {
  if (!memorial.bio) return null;

  const imageSrc = portrait?.url || memorial.portraitImage || memorial.heroImage || null;

  return (
    <section id="story" className="bg-white">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-full max-w-[260px] md:mx-0">
          <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-sm">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`Portrait of ${memorial.deceasedName}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-ink-100 text-ink-400">
                <span className="text-4xl">🕯️</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="divider mb-3 justify-start text-xs uppercase tracking-[0.25em]">
            Biography
          </div>
          <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
            A life well lived
          </h2>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink-600">
            {memorial.bio}
          </p>

          {memorial.customSections.map((s) => (
            <div key={s.id} className="mt-10 border-t border-ink-100 pt-8">
              <h3 className="font-serif text-xl font-semibold text-ink-900">
                {s.title}
              </h3>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-600">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
