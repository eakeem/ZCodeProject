"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Memorial } from "@/lib/types";

export default function MemorialEditor({
  memorial,
}: {
  memorial: Memorial;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    deceasedName: memorial.deceasedName,
    birthDate: memorial.birthDate || "",
    passingDate: memorial.passingDate || "",
    tagline: memorial.tagline || "",
    heroImage: memorial.heroImage || "",
    portraitImage: memorial.portraitImage || "",
    bio: memorial.bio || "",
    published: memorial.published,
  });
  const [sections, setSections] = useState(memorial.customSections);
  const [service, setService] = useState({
    date: memorial.serviceInfo?.date || "",
    time: memorial.serviceInfo?.time || "",
    location: memorial.serviceInfo?.location || "",
    notes: memorial.serviceInfo?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveMain() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/memorial/${memorial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Saved.");
      router.refresh();
    } catch {
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveService() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/memorial/${memorial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceInfo: service }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Service details saved.");
      router.refresh();
    } catch {
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSections() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/memorial/${memorial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customSections: sections }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Custom sections saved.");
      router.refresh();
    } catch {
      setMsg("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 focus:border-candle-500";
  const label = "mb-1.5 block text-sm font-medium text-ink-700";

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-lg bg-sage-50 px-4 py-2.5 text-sm text-sage-700">
          {msg}
        </div>
      )}

      {/* MAIN DETAILS */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Memorial details
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Name of the deceased</label>
            <input
              className={field}
              value={form.deceasedName}
              onChange={(e) => setForm({ ...form, deceasedName: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Date of birth</label>
            <input
              type="date"
              className={field}
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Date of passing</label>
            <input
              type="date"
              className={field}
              value={form.passingDate}
              onChange={(e) => setForm({ ...form, passingDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Tagline (shown under the name)</label>
            <input
              className={field}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Hero image URL</label>
            <input
              className={field}
              value={form.heroImage}
              onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Biography / life story</label>
            <textarea
              rows={6}
              className={field}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-ink-700">
              Published (visible to visitors)
            </span>
          </label>
        </div>
        <button
          onClick={saveMain}
          disabled={saving}
          className="mt-5 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save details"}
        </button>
      </section>

      {/* CUSTOM SECTIONS */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-ink-900">
            Custom text sections
          </h2>
          <button
            onClick={() =>
              setSections([
                ...sections,
                { id: `new-${Date.now()}`, title: "New section", body: "" },
              ])
            }
            className="rounded-full border border-ink-200 px-4 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            + Add section
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {sections.length === 0 && (
            <p className="text-sm text-ink-400">
              No custom sections yet. Add a favourite quote, charity request,
              or any other text you'd like to display.
            </p>
          )}
          {sections.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  className={field}
                  value={s.title}
                  placeholder="Section title"
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[i] = { ...s, title: e.target.value };
                    setSections(copy);
                  }}
                />
                <button
                  onClick={() => setSections(sections.filter((x) => x.id !== s.id))}
                  className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={3}
                className={`mt-2 ${field}`}
                value={s.body}
                placeholder="Section text..."
                onChange={(e) => {
                  const copy = [...sections];
                  copy[i] = { ...s, body: e.target.value };
                  setSections(copy);
                }}
              />
            </div>
          ))}
        </div>
        {sections.length > 0 && (
          <button
            onClick={saveSections}
            disabled={saving}
            className="mt-5 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save sections"}
          </button>
        )}
      </section>

      {/* SERVICE INFO */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Service details
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Date</label>
            <input
              type="date"
              className={field}
              value={service.date}
              onChange={(e) => setService({ ...service, date: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Time</label>
            <input
              className={field}
              value={service.time}
              onChange={(e) => setService({ ...service, time: e.target.value })}
              placeholder="11:00"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Location</label>
            <input
              className={field}
              value={service.location}
              onChange={(e) => setService({ ...service, location: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Notes</label>
            <textarea
              rows={2}
              className={field}
              value={service.notes}
              onChange={(e) => setService({ ...service, notes: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={saveService}
          disabled={saving}
          className="mt-5 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save service details"}
        </button>
      </section>
    </div>
  );
}
