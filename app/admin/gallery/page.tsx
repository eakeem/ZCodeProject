import AdminShell from "@/components/admin/AdminShell";
import GalleryManager from "@/components/admin/GalleryManager";
import SharedPhotoModeration from "@/components/admin/SharedPhotoModeration";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant, getMediaByMemorial, getSharedPhotosByMemorial } from "@/lib/repo";
import { getTier } from "@/lib/tiers";
import { redirect } from "next/navigation";

export default async function GalleryAdminPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login?redirect=/admin/gallery");

  const memorials = await getMemorialsByTenant(tenant.id);
  const memorial = memorials[0];

  if (!memorial) {
    return (
      <AdminShell active="/admin/gallery">
        <p className="text-ink-500">Create your memorial first.</p>
      </AdminShell>
    );
  }

  const media = await getMediaByMemorial(memorial.id);
  const sharedPhotos = await getSharedPhotosByMemorial(memorial.id);
  const tier = getTier(tenant.tier);

  return (
    <AdminShell active="/admin/gallery">
      <GalleryManager
        memorialId={memorial.id}
        slug={memorial.slug}
        initial={media}
        maxImages={tier.limits.maxGalleryImages}
        currentCount={media.length}
      />
      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink-900">
          Visitor shared photos
        </h2>
        <p className="mb-6 text-sm text-ink-500">
          Approve or reject visitor uploads before they appear on the memorial.
        </p>
        <SharedPhotoModeration initial={sharedPhotos} />
      </div>
    </AdminShell>
  );
}
