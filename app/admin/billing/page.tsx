import AdminShell from "@/components/admin/AdminShell";
import BillingPanel from "@/components/admin/BillingPanel";
import { getCurrentTenant } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login?redirect=/admin/billing");

  return (
    <AdminShell active="/admin/billing">
      <BillingPanel currentTier={tenant.tier} configured={isStripeConfigured()} />
    </AdminShell>
  );
}
