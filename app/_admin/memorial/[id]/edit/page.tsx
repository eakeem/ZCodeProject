import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/admin/supabase";
import { requireAdminProfile } from "@/lib/admin/access";
import EditMemorialForm from "@/components/admin/EditMemorialForm";

export default async function EditMemorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminProfile();
  const { id } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("memorials")
    .select(
      "id,deceased_name,slug,created_at,published,hero_image,tenant_id,birth_date,passing_date,tagline,bio",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const memorial = {
    id: data.id,
    name: data.deceased_name,
    slug: data.slug,
    created_at: data.created_at,
    is_published: data.published,
    hero_image_url: data.hero_image,
    user_id: data.tenant_id,
    date_of_birth: data.birth_date,
    date_of_death: data.passing_date,
    tagline: data.tagline,
    bio: data.bio,
    customer_name: null,
    customer_email: null,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-ink-50 to-white px-4 py-5 sm:px-6 sm:py-8">
      <Toaster position="top-right" richColors />
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
        >
          <ArrowLeft size={15} />
          Back to Admin
        </Link>

        <h1 className="mb-4 text-2xl font-semibold text-ink-900">Edit Memorial</h1>
        <EditMemorialForm memorial={memorial} />
      </div>
    </main>
  );
}
