"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Login form for the admin dashboard.
 */
export default function AuthForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      window.location.assign(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 focus:border-candle-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 focus:border-candle-500"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink-900 px-6 py-3.5 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {loading ? "Please wait..." : "Log in"}
      </button>
    </form>
  );
}
