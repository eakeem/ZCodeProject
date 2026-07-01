import AdminShell from "@/components/admin/AdminShell";
import MemorialEditor from "@/components/admin/MemorialEditor";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant, createMemorial } from "@/lib/repo";
import { redirect } from "next/navigation";

export default async function MemorialAdminPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login?redirect=/admin/memorial");

  const memorials = await getMemorialsByTenant(tenant.id);
  let memorial = memorials[0];

  // auto-create the first memorial if none exists
  if (!memorial) {
    const base = (tenant.name || "memorial")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    memorial = await createMemorial({
      tenantId: tenant.id,
      slug: `${base}-${Date.now().toString(36)}`,
      deceasedName: tenant.name || "Memorial",
      published: true,
      tagline: "A memorial page is ready for you.",
      bio: "This page was created automatically so you can start editing it.",
      customSections: [],
      serviceInfo: {},
    });
  }

  return (
    <AdminShell active="/admin/memorial">
      <MemorialEditor memorial={memorial} />
    </AdminShell>
  );
}
