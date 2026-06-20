"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Shared client form for /login and /signup. `mode` toggles labels.
 */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload =
      mode === "login"
        ? { email, password }
        : { email, name, password };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push(redirect);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {mode === "signup" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 focus:border-candle-500"
            placeholder="e.g. The Johnson Family"
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          type="email"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 focus:border-candle-500"
          placeholder="••••••••"
        />
        {mode === "signup" && (
          <p className="mt-1 text-xs text-ink-400">At least 8 characters.</p>
        )}
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
        {loading
          ? "Please wait..."
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>
    </form>
  );
}
