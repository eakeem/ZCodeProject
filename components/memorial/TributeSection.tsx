"use client";

import { useState } from "react";
import type { Tribute } from "@/lib/types";
import Candle from "@/components/Candle";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 1) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const mins = Math.floor(diff / 60000);
  if (mins >= 1) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  return "Just now";
}

export default function TributeSection({
  memorialId,
  initialTributes,
  initialCandles,
}: {
  memorialId: string;
  initialTributes: Tribute[];
  initialCandles: Tribute[];
}) {
  const [tributes, setTributes] = useState<Tribute[]>(initialTributes);
  const [candles, setCandles] = useState<Tribute[]>(initialCandles);
  const [tab, setTab] = useState<"message" | "candle">("message");

  // message form state
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success" }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function submit(type: "message" | "candle") {
    if (!name.trim() || !message.trim()) {
      setStatus({ kind: "error", msg: "Please add your name and a message." });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/tributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialId,
          type,
          authorName: name.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus({ kind: "success" });
      setMessage("");
      // visually add to the wall as "pending" so the visitor sees it,
      // with a note that it's awaiting approval.
      const created: Tribute = await res.json();
      if (type === "candle") {
        setCandles((c) => [{ ...created, status: "pending" }, ...c]);
      } else {
        setTributes((t) => [{ ...created, status: "pending" }, ...t]);
      }
    } catch (e) {
      setStatus({
        kind: "error",
        msg: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  }

  return (
    <>
      {/* ============ TRIBUTE WALL ============ */}
      <section id="tributes" className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <div className="divider mb-3 text-xs uppercase tracking-[0.25em]">
              Tributes
            </div>
            <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
              Words of remembrance
            </h2>
            <p className="mt-3 text-ink-500">
              Share a memory or message of support for the family.
            </p>
          </div>

          {tributes.length === 0 ? (
            <p className="text-center text-ink-400">
              No tributes yet. Be the first to share a kind word.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tributes.map((t) => (
                <TributeCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ CANDLE WALL ============ */}
      <section id="candles" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <div className="divider mb-3 text-xs uppercase tracking-[0.25em]">
            A quiet glow
          </div>
          <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
            Candles of remembrance
          </h2>
          <p className="mt-3 text-ink-500">
            Each candle is a moment of love, lit in memory.
          </p>
        </div>

        {candles.length === 0 ? (
          <p className="text-center text-ink-400">
            No candles lit yet.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {candles.map((c) => (
              <div
                key={c.id}
                className="flex w-32 flex-col items-center rounded-2xl bg-ink-50 p-4 text-center"
              >
                <Candle size={36} />
                <p className="mt-2 text-sm font-medium text-ink-800">
                  {c.authorName}
                </p>
                {c.message && (
                  <p className="mt-1 line-clamp-3 text-xs text-ink-500">
                    {c.message}
                  </p>
                )}
                {c.status === "pending" && (
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-candle-600">
                    Awaiting approval
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ SHARE A TRIBUTE FORM ============ */}
      <section className="bg-ink-900 text-ink-50">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-semibold">
              Share a tribute
            </h2>
            <p className="mt-2 text-ink-300">
              Your kind words mean a great deal to the family.
            </p>
          </div>

          {/* tab switch */}
          <div className="mx-auto mb-8 flex max-w-xs rounded-full bg-ink-800 p-1">
            <button
              onClick={() => setTab("message")}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                tab === "message"
                  ? "bg-candle-500 text-white"
                  : "text-ink-300 hover:text-white"
              }`}
            >
              ✉️ Message
            </button>
            <button
              onClick={() => setTab("candle")}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                tab === "candle"
                  ? "bg-candle-500 text-white"
                  : "text-ink-300 hover:text-white"
              }`}
            >
              🕯️ Light a candle
            </button>
          </div>

          {tab === "candle" && (
            <div className="mb-6 flex justify-center">
              <Candle size={56} />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-ink-300">Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-ink-50 placeholder-ink-500 focus:border-candle-500"
                placeholder="e.g. Sarah M."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-ink-300">
                {tab === "candle" ? "A word of remembrance" : "Your message"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={5}
                className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-ink-50 placeholder-ink-500 focus:border-candle-500"
                placeholder={
                  tab === "candle"
                    ? "In loving memory..."
                    : "Share a memory or a message for the family..."
                }
              />
            </div>

            {status.kind === "error" && (
              <p className="rounded-lg bg-red-500/15 px-4 py-2.5 text-sm text-red-300">
                {status.msg}
              </p>
            )}
            {status.kind === "success" && (
              <p className="rounded-lg bg-sage-500/20 px-4 py-3 text-sm text-sage-200">
                Thank you. Your{" "}
                {tab === "candle" ? "candle" : "tribute"} has been received and
                will appear once the family approves it. 💛
              </p>
            )}

            <button
              onClick={() => submit(tab)}
              disabled={status.kind === "submitting"}
              className="w-full rounded-full bg-candle-500 px-6 py-3.5 font-medium text-white transition hover:bg-candle-600 disabled:opacity-60"
            >
              {status.kind === "submitting"
                ? "Sending..."
                : tab === "candle"
                  ? "Light a candle"
                  : "Send tribute"}
            </button>
            <p className="text-center text-xs text-ink-400">
              Tributes are reviewed by the family before they appear publicly.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function TributeCard({ t }: { t: Tribute }) {
  return (
    <article className="lift relative rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-ink-900">{t.authorName}</span>
        <span className="text-xs text-ink-400">{timeAgo(t.createdAt)}</span>
      </div>
      <p className="whitespace-pre-line text-ink-600">{t.message}</p>
      {t.status === "pending" && (
        <p className="mt-3 text-[11px] uppercase tracking-wide text-candle-600">
          Awaiting approval
        </p>
      )}
    </article>
  );
}
