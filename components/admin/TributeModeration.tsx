"use client";

import { useState } from "react";
import type { Tribute } from "@/lib/types";

export default function TributeModeration({ initial }: { initial: Tribute[] }) {
  const [items, setItems] = useState<Tribute[]>(initial);

  async function act(id: string, action: "approve" | "reject" | "delete") {
    const res = await fetch(`/api/admin/tributes/${id}`, { method: "PATCH", body: JSON.stringify({ action }), headers: { "Content-Type": "application/json" } });
    if (!res.ok) return;
    setItems((list) =>
      action === "delete"
        ? list.filter((t) => t.id !== id)
        : list.filter((t) => t.id !== id),
    );
  }

  const pending = items.filter((t) => t.status === "pending");
  const approved = items.filter((t) => t.status === "approved");
  const rejected = items.filter((t) => t.status === "rejected");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <Group title="Awaiting your review" items={pending}>
          {(t) => (
            <div className="mt-3 flex gap-2">
              <button onClick={() => act(t.id, "approve")} className="rounded-full bg-sage-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sage-700">
                Approve
              </button>
              <button onClick={() => act(t.id, "reject")} className="rounded-full border border-ink-200 px-4 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
                Reject
              </button>
            </div>
          )}
        </Group>
      )}
      {pending.length === 0 && approved.length === 0 && rejected.length === 0 && (
        <p className="text-ink-500">No tributes yet. When visitors submit one, it will appear here for review.</p>
      )}
      {pending.length === 0 && (approved.length > 0 || rejected.length > 0) && (
        <div className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
          All caught up — no tributes waiting.
        </div>
      )}

      {approved.length > 0 && (
        <Group title={`Published (${approved.length})`} items={approved}>
          {(t) => (
            <button onClick={() => act(t.id, "delete")} className="mt-3 text-sm text-red-500 hover:underline">
              Remove
            </button>
          )}
        </Group>
      )}
      {rejected.length > 0 && (
        <Group title={`Rejected (${rejected.length})`} muted items={rejected}>
          {(t) => (
            <button onClick={() => act(t.id, "approve")} className="mt-3 text-sm text-sage-700 hover:underline">
              Approve instead
            </button>
          )}
        </Group>
      )}
    </div>
  );
}

function Group({
  title,
  items,
  children,
  muted,
}: {
  title: string;
  items: Tribute[];
  children: (t: Tribute) => React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-lg font-semibold text-ink-900">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <article key={t.id} className={`rounded-2xl border bg-white p-5 ${muted ? "border-ink-100 opacity-70" : "border-ink-100"}`}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-ink-900">{t.authorName}</span>
              <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-500">
                {t.type === "candle" ? "🕯️ candle" : "✉️ message"}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm text-ink-600">{t.message}</p>
            {children(t)}
          </article>
        ))}
      </div>
    </section>
  );
}
