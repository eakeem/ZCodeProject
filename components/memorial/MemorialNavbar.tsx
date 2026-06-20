"use client";

import Link from "next/link";
import { useState } from "react";

const SECTIONS = [
  { id: "gallery", label: "Gallery" },
  { id: "story", label: "Life Story" },
  { id: "service", label: "Service" },
  { id: "tributes", label: "Tributes" },
  { id: "candles", label: "Light a Candle" },
];

export default function MemorialNavbar({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/70 bg-ink-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="#top"
          className="font-serif text-lg font-semibold text-ink-900"
        >
          In loving memory of
          <span className="ml-2 italic text-candle-700">{name}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm font-medium text-ink-600 transition hover:text-candle-700"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <button
          className="rounded-md p-2 text-ink-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="no-scrollbar flex gap-5 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              className="whitespace-nowrap py-2 text-sm text-ink-700"
            >
              {s.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
