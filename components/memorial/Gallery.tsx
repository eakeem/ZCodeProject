"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/types";

export default function Gallery({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<MediaItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section id="gallery" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="mb-10 text-center">
        <div className="divider mb-3 text-xs uppercase tracking-[0.25em]">
          A life in pictures
        </div>
        <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
          Gallery
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m)}
            className="lift group relative aspect-square overflow-hidden rounded-xl bg-ink-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt={m.caption || "Photograph"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 p-4 animate-fadeIn"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute right-5 top-5 text-3xl text-ink-100"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            ×
          </button>
          <figure className="max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || "Photograph"}
              className="max-h-[78vh] w-auto rounded-lg object-contain"
            />
            {active.caption && (
              <figcaption className="mt-3 text-center text-ink-100">
                {active.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
