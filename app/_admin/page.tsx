import { createAdminClient, publicAppUrl } from "@/lib/admin/supabase";
import { requireAdminProfile } from "@/lib/admin/access";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Memorial Admin",
};

export default async function AdminDashboardPage() {
  await requireAdminProfile();

  const admin = createAdminClient();
  let data:
    | Array<{
        id: string;
        deceased_name: string;
        slug: string;
        created_at: string;
        published: boolean;
        hero_image: string | null;
        tenant_id: string;
        birth_date: string | null;
        passing_date: string | null;
        tagline: string | null;
        bio: string | null;
      }>
    | null = null;

  try {
    const result = await admin
      .from("memorials")
      .select(
        "id,deceased_name,slug,created_at,published,hero_image,tenant_id,birth_date,passing_date,tagline,bio",
      )
      .order("created_at", { ascending: false });

    data = (result.data as typeof data) || [];
  } catch {
    data = [];
  }

  const memorials = (data || []).map((m) => ({
    id: m.id,
    name: m.deceased_name,
    slug: m.slug,
    created_at: m.created_at,
    is_published: m.published,
    hero_image_url: m.hero_image,
    user_id: m.tenant_id,
    date_of_birth: m.birth_date,
    date_of_death: m.passing_date,
    tagline: m.tagline,
    bio: m.bio,
    customer_name: null,
    customer_email: null,
  }));

  return (
    <AdminDashboardClient memorials={memorials} appUrl={publicAppUrl()} />
  );
}
