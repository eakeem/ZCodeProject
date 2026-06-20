import AdminShell from "@/components/admin/AdminShell";
import GalleryManager from "@/components/admin/GalleryManager";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant, getMediaByMemorial } from "@/lib/repo";
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
  const tier = getTier(tenant.tier);

  return (
    <AdminShell active="/admin/gallery">
      <GalleryManager
        memorialId={memorial.id}
        initial={media}
        maxImages={tier.limits.maxGalleryImages}
        currentCount={media.length}
      />
    </AdminShell>
  );
}
