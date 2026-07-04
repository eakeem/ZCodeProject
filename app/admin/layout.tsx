"use client";

import { useEffect, useState } from "react";

/**
 * Client guard for the admin dashboard.
 * Server-side auth checks live in proxy.ts (Next.js 16 proxy convention),
 * so this layout only handles a safe hydration boundary to prevent any
 * client redirect loops.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid rendering admin UI until after hydration so any legacy client
  // redirects cannot fire against stale server-rendered state.
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-candle-500" />
      </div>
    );
  }

  return <>{children}</>;
}
