import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/admin/session";

export async function requireAdminProfile(): Promise<{ userId: string }> {
  const claims = await getSessionClaims();
  const userId = claims?.authUserId || claims?.tenantId;
  if (!userId) {
    redirect("/login?redirect=/admin");
  }

  if (!claims?.isAdmin) {
    redirect("/unauthorized");
  }

  return { userId };
}
