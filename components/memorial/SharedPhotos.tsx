"use client";

import { useState } from "react";
import type { SharedPhoto } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; msg: string };

export default function SharedPhotos({
  memorialId,
  initial,
}: {
  memorialId: string;
  initial: SharedPhoto[];
}) {
  const [photos, setPhotos] = useState<SharedPhoto[]>(initial);
  const [active, setActive] = useState<SharedPhoto | null>(null);

  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fileName, setFileName] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!name.trim()) {
      setStatus({ kind: "error", msg: "Please add your name." });
      return;
    }
    if (!file) {
      setStatus({ kind: "error", msg: "Please choose an image to share." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const fd = new FormData();
      fd.append("memorialId", memorialId);
      fd.append("authorName", name.trim());
      if (caption.trim()) fd.append("caption", caption.trim());
      fd.append("file", file);

      const res = await fetch("/api/shared-photos", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus({ kind: "success" });
      setName("");
      setCaption("");
      setFileName("");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setStatus({
        kind: "error",
        msg: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <section id="shared-photos" className="bg-ink-50">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <div className="divider mb-3 text-xs uppercase tracking-[0.25em]">
            Memories shared by friends and family
          </div>
          <h2 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
            Shared photos
          </h2>
          <p className="mt-3 text-ink-500">
            A collection of moments shared by those who knew and loved{" "}
            {photos.length > 0 ? "them" : "the family"}.
          </p>
        </div>

        {/* ============ MASONRY GALLERY ============ */}
        {photos.length === 0 ? (
          <p className="text-center text-ink-400">
            No shared photos yet. Be the first to add one below.
          </p>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 [&>*]:mb-3 sm:[&>*]:mb-4">
            {photos.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="lift group block w-full break-inside-avoid overflow-hidden rounded-xl bg-ink-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || `Photo shared by ${p.authorName}`}
                  className="w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {(p.caption || p.authorName) && (
                  <span className="block px-2 py-1.5 text-left text-[11px] text-ink-500">
                    {p.caption ? (
                      <span className="line-clamp-2">{p.caption}</span>
                    ) : null}
                    {!p.caption && p.authorName ? (
                      <span>— {p.authorName}</span>
                    ) : null}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ============ VISITOR UPLOAD FORM ============ */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-14 max-w-xl rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <h3 className="font-serif text-xl font-semibold text-ink-900">
            Share a photo
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            Add a photo to the collection. It will appear once the family approves it.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 focus:border-candle-500"
                placeholder="e.g. Sarah M."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Choose a photo
              </label>
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                disabled={status.kind === "submitting"}
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-full file:border-0 file:bg-ink-900 file:px-5 file:py-2 file:font-medium file:text-ink-50 hover:file:bg-ink-800"
              />
              {fileName && (
                <p className="mt-1.5 truncate text-xs text-ink-400">{fileName}</p>
              )}
              <p className="mt-1.5 text-xs text-ink-400">
                JPG, PNG, WebP, GIF or AVIF — up to 10MB.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Caption <span className="text-ink-400">(optional)</span>
              </label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 focus:border-candle-500"
                placeholder="e.g. Mary at the autumn fair, 2010"
              />
            </div>

            {status.kind === "error" && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {status.msg}
              </p>
            )}
            {status.kind === "success" && (
              <p className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
                Thank you — your photo has been received and will appear once the
                family approves it. 💛
              </p>
            )}

            <button
              type="submit"
              disabled={status.kind === "submitting"}
              className="w-full rounded-full bg-candle-500 px-6 py-3 font-medium text-white transition hover:bg-candle-600 disabled:opacity-60"
            >
              {status.kind === "submitting" ? "Sending..." : "Share photo"}
            </button>
            <p className="text-center text-xs text-ink-400">
              Shared photos are reviewed by the family before they appear publicly.
            </p>
          </div>
        </form>
      </div>

      {/* ============ LIGHTBOX ============ */}
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
    </section>
  );
}
