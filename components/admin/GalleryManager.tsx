"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/types";

export default function GalleryManager({
  memorialId,
  initial,
  maxImages, // -1 = unlimited
  currentCount,
}: {
  memorialId: string;
  initial: MediaItem[];
  maxImages: number;
  currentCount: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const remaining = maxImages === -1 ? Infinity : Math.max(0, maxImages - currentCount);
  const full = remaining <= 0;

  async function uploadFile(file: File) {
    setUploadingFile(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("memorialId", memorialId);
      if (caption) fd.append("caption", caption);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Response wasn't JSON (e.g. 413 from the server)
      }
      if (!res.ok) {
        if (res.status === 413) throw new Error("Image is too large. Please choose a file under 10 MB.");
        throw new Error(data.error || "Upload failed");
      }
      setItems((i) => [data, ...i]);
      setCaption("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  }

  async function addByUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memorialId, url: url.trim(), caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add image");
      setItems((i) => [data, ...i]);
      setUrl("");
      setCaption("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add image");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((i) => i.filter((m) => m.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {full && (
        <div className="rounded-lg bg-candle-50 px-4 py-2.5 text-sm text-candle-800">
          You've reached your plan's photo limit. Upgrade on the Plan &amp; billing
          page to add more.
        </div>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* add image */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Add a photo
        </h2>

        {/* file upload */}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Upload from your device
          </label>
          <input
            type="file"
            accept="image/*"
            disabled={full || uploadingFile}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.currentTarget.value = "";
            }}
            className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-full file:border-0 file:bg-ink-900 file:px-5 file:py-2 file:font-medium file:text-ink-50 hover:file:bg-ink-800"
          />
          {uploadingFile && (
            <p className="mt-2 text-sm text-ink-500">Uploading…</p>
          )}
          <input
            className="mt-3 w-full rounded-xl border border-ink-200 px-4 py-2.5 focus:border-candle-500"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {/* url fallback */}
        <div className="mt-5 border-t border-ink-100 pt-5">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Or paste an image URL
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 focus:border-candle-500"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={addByUrl}
              disabled={busy || full || !url.trim()}
              className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
            >
              {busy ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            {remaining === Infinity
              ? "Unlimited uploads on your plan."
              : `${remaining} upload${remaining === 1 ? "" : "s"} remaining on your plan.`}
          </p>
        </div>
      </section>

      {/* grid */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Gallery ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">
            No photos yet. Upload your first image above.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.caption || ""} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink-900/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  {m.caption && (
                    <span className="truncate text-xs text-white">{m.caption}</span>
                  )}
                  <button
                    onClick={() => remove(m.id)}
                    className="shrink-0 rounded bg-white/90 px-2 py-1 text-xs text-red-600 hover:bg-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
