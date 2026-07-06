"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Marketing/public header — used on the homepage and landing.
 * (Memorial pages use their own MemorialNavbar.)
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#features", label: "Features" },
    { href: "/#how", label: "What we offer" },
    
    { href: "/pricing", label: "Pricing" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-ink-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-extrabold tracking-wide text-ink-900">
              <span className="text-[#E63946]">MEM</span>
              <span className="text-[#1D3557]">FORIAL</span>
            </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-600 transition hover:text-ink-900"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50 transition hover:bg-ink-800"
          >
            Log in
          </Link>
        </nav>

        <button
          className="rounded-md p-2 text-ink-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-ink-50 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-ink-700"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="my-2 rounded-full bg-ink-900 px-5 py-3 text-center text-sm font-medium text-ink-50"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
