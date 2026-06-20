import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant, getMediaByMemorial, getTributesByStatus } from "@/lib/repo";
import { getTier } from "@/lib/tiers";

export default async function AdminOverview() {
  return (
    <AdminShell active="/admin">
      <OverviewBody />
    </AdminShell>
  );
}

async function OverviewBody() {
  const tenant = (await getCurrentTenant())!;
  const memorials = await getMemorialsByTenant(tenant.id);
  const memorial = memorials[0];

  if (!memorial) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
        <p className="text-ink-500">You don't have a memorial yet.</p>
        <Link
          href="/admin/memorial"
          className="mt-4 inline-block rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-ink-50"
        >
          Create your memorial
        </Link>
      </div>
    );
  }

  const media = await getMediaByMemorial(memorial.id);
  const pending = await getTributesByStatus(memorial.id, "pending");
  const approved = await getTributesByStatus(memorial.id, "approved");
  const tier = getTier(tenant.tier);

  const stats = [
    { label: "Plan", value: tier.name, sub: `$${tier.priceMonthly}/mo` },
    { label: "Gallery photos", value: media.length, sub: tier.limits.maxGalleryImages === -1 ? "unlimited" : `of ${tier.limits.maxGalleryImages}` },
    { label: "Tributes", value: approved.length, sub: "approved" },
    { label: "Awaiting review", value: pending.length, sub: pending.length > 0 ? "needs attention" : "all clear", warn: pending.length > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border bg-white p-5 ${s.warn ? "border-candle-300" : "border-ink-100"}`}
          >
            <p className="text-xs uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-ink-900">
              {s.value}
            </p>
            <p className={`text-xs ${s.warn ? "text-candle-600" : "text-ink-400"}`}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <Link
          href="/admin/tributes"
          className="block rounded-2xl border border-candle-200 bg-candle-50 p-5 transition hover:bg-candle-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-candle-900">
                {pending.length} tribute{pending.length === 1 ? "" : "s"} waiting for approval
              </p>
              <p className="text-sm text-candle-700">
                Review them so they appear on the memorial.
              </p>
            </div>
            <span className="text-candle-700">→</span>
          </div>
        </Link>
      )}

      <div className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Your memorial
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-lg font-medium text-ink-900">
              {memorial.deceasedName}
            </p>
            <p className="text-sm text-ink-500">
              {memorial.published ? "Published" : "Draft"} · /m/{memorial.slug}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/memorial"
              className="rounded-full border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              Edit page
            </Link>
            <a
              href={`/m/${memorial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50 hover:bg-ink-800"
            >
              View ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
