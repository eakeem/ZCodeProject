"use client";

import { useState } from "react";
import type { SharedPhoto } from "@/lib/types";

export default function SharedPhotoModeration({
  initial,
}: {
  initial: SharedPhoto[];
}) {
  const [items, setItems] = useState<SharedPhoto[]>(initial);
  const [active, setActive] = useState<SharedPhoto | null>(null);

  async function act(id: string, action: "approve" | "reject" | "delete") {
    const res = await fetch(`/api/admin/shared-photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return;
    setItems((list) =>
      action === "delete"
        ? list.filter((p) => p.id !== id)
        : list.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: action === "approve" ? "approved" : "rejected",
                }
              : p,
          ),
    );
  }

  const pending = items.filter((p) => p.status === "pending");
  const approved = items.filter((p) => p.status === "approved");
  const rejected = items.filter((p) => p.status === "rejected");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <Group
          title={`Awaiting your review (${pending.length})`}
          items={pending}
          onOpen={setActive}
        >
          {(p) => (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => act(p.id, "approve")}
                className="rounded-full bg-sage-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sage-700"
              >
                Approve
              </button>
              <button
                onClick={() => act(p.id, "reject")}
                className="rounded-full border border-ink-200 px-4 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                Reject
              </button>
            </div>
          )}
        </Group>
      )}

      {pending.length === 0 &&
        approved.length === 0 &&
        rejected.length === 0 && (
          <p className="text-ink-500">
            No shared photos yet. When a visitor submits one, it will appear here
            for review.
          </p>
        )}

      {pending.length === 0 && (approved.length > 0 || rejected.length > 0) && (
        <div className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
          All caught up — no shared photos waiting.
        </div>
      )}

      {approved.length > 0 && (
        <Group
          title={`Published (${approved.length})`}
          items={approved}
          onOpen={setActive}
        >
          {(p) => (
            <button
              onClick={() => act(p.id, "delete")}
              className="mt-3 text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          )}
        </Group>
      )}

      {rejected.length > 0 && (
        <Group
          title={`Rejected (${rejected.length})`}
          items={rejected}
          onOpen={setActive}
          muted
        >
          {(p) => (
            <button
              onClick={() => act(p.id, "approve")}
              className="mt-3 text-sm text-sage-700 hover:underline"
            >
              Approve instead
            </button>
          )}
        </Group>
      )}

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
          <figure
            className="max-h-[85vh] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || "Shared photograph"}
              className="max-h-[78vh] w-auto rounded-lg object-contain"
            />
            {(active.caption || active.authorName) && (
              <figcaption className="mt-3 text-center text-ink-100">
                {active.caption && <span>{active.caption} </span>}
                {active.authorName && (
                  <span className="text-ink-300">— {active.authorName}</span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  items,
  children,
  onOpen,
  muted,
}: {
  title: string;
  items: SharedPhoto[];
  children: (p: SharedPhoto) => React.ReactNode;
  onOpen: (p: SharedPhoto) => void;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-lg font-semibold text-ink-900">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((p) => (
          <article
            key={p.id}
            className={`overflow-hidden rounded-2xl border bg-white ${
              muted ? "border-ink-100 opacity-70" : "border-ink-100"
            }`}
          >
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="block aspect-square w-full overflow-hidden bg-ink-100"
              aria-label="View photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || ""}
                className="h-full w-full object-cover transition hover:scale-105"
              />
            </button>
            <div className="p-3">
              <p className="text-xs font-medium text-ink-700">{p.authorName}</p>
              {p.caption && (
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">
                  {p.caption}
                </p>
              )}
            </div>
            <div className="px-3 pb-3">{children(p)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
