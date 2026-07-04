"use client";

import { useState, useTransition } from "react";
import { ImageUp, Save } from "lucide-react";
import { toast } from "sonner";
import { updateMemorialAction, uploadHeroImageAction } from "@/app/_admin/actions";
import type { AdminMemorial } from "@/lib/admin/types";

export default function EditMemorialForm({ memorial }: { memorial: AdminMemorial }) {
  const [isPending, startTransition] = useTransition();
  const [uploadPending, setUploadPending] = useState(false);

  async function onUpdate(formData: FormData) {
    startTransition(async () => {
      const res = await updateMemorialAction(formData);
      if (!res.ok) {
        toast.error(res.error || "Could not save changes.");
        return;
      }
      toast.success("Memorial updated.");
    });
  }

  async function onHeroUpload(formData: FormData) {
    setUploadPending(true);
    const res = await uploadHeroImageAction(formData);
    setUploadPending(false);

    if (!res.ok) {
      toast.error(res.error || "Hero upload failed.");
      return;
    }

    toast.success("Hero image updated.");
  }

  return (
    <div className="space-y-5">
      <form action={onUpdate} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
        <input type="hidden" name="id" value={memorial.id} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-ink-600 sm:col-span-2">
            Memorial Name
            <input
              required
              name="name"
              defaultValue={memorial.name}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="text-sm text-ink-600 sm:col-span-2">
            Slug
            <input
              required
              name="slug"
              defaultValue={memorial.slug}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="text-sm text-ink-600">
            Date of Birth
            <input
              type="date"
              name="date_of_birth"
              defaultValue={memorial.date_of_birth || ""}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="text-sm text-ink-600">
            Date of Death
            <input
              type="date"
              name="date_of_death"
              defaultValue={memorial.date_of_death || ""}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="text-sm text-ink-600 sm:col-span-2">
            Tagline
            <input
              name="tagline"
              defaultValue={memorial.tagline || ""}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="text-sm text-ink-600 sm:col-span-2">
            Bio
            <textarea
              rows={7}
              name="bio"
              defaultValue={memorial.bio || ""}
              className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
            <input type="checkbox" name="is_published" defaultChecked={memorial.is_published} />
            Published
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
        >
          <Save size={15} />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <form action={onHeroUpload} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
        <input type="hidden" name="id" value={memorial.id} />

        <p className="mb-2 text-sm font-medium text-ink-700">Upload New Hero Image</p>
        <input
          type="file"
          name="hero_image"
          accept="image/*"
          required
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={uploadPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
        >
          <ImageUp size={15} />
          {uploadPending ? "Uploading..." : "Upload Hero Image"}
        </button>
      </form>
    </div>
  );
}
