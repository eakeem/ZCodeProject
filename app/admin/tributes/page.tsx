import AdminShell from "@/components/admin/AdminShell";
import TributeModeration from "@/components/admin/TributeModeration";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant, getTributesByStatus } from "@/lib/repo";
import { redirect } from "next/navigation";

export default async function TributesAdminPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login?redirect=/admin/tributes");

  const memorials = await getMemorialsByTenant(tenant.id);
  const memorial = memorials[0];

  if (!memorial) {
    return (
      <AdminShell active="/admin/tributes">
        <p className="text-ink-500">Create your memorial first.</p>
      </AdminShell>
    );
  }

  const all = await getTributesByStatus(memorial.id); // every status
  return (
    <AdminShell active="/admin/tributes">
      <TributeModeration initial={all} />
    </AdminShell>
  );
}
