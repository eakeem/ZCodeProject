import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialsByTenant } from "@/lib/repo";
import { getTier } from "@/lib/tiers";
import { logoutAndRedirect as logoutAction } from "@/app/admin/actions";


const NAV = [
  { href: "/admin", label: "Home", icon: "🏠" },
  { href: "/admin/overview", label: "Overview", icon: "📊" },
  { href: "/admin/memorial", label: "Memorial page", icon: "🕯️" },
  { href: "/admin/gallery", label: "Gallery", icon: "🖼️" },
  { href: "/admin/tributes", label: "Tributes", icon: "✉️" },
  { href: "/admin/billing", label: "Plan & billing", icon: "💳" },
];

export default async function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login?redirect=/admin");

  const memorials = await getMemorialsByTenant(tenant.id);
  const tier = getTier(tenant.tier);

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      {/* sidebar */}
      <aside className="border-b border-ink-100 bg-white lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-6 py-5">
           <span className="font-serif text-2xl font-extrabold tracking-wide text-ink-900">
              <span className="text-[#E63946]">MEM</span>
              <span className="text-[#1D3557]">FORIAL</span>
            </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
          {NAV.map((n) => {
            const isActive = active === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-candle-100 text-candle-800"
                    : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-ink-100 p-4 lg:block">
          <div className="rounded-xl bg-ink-50 p-3">
            <p className="text-xs text-ink-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-ink-900">
              {tenant.email}
            </p>
            <p className="mt-2 inline-block rounded-full bg-candle-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-candle-800">
              {tier.name} plan
            </p>
          </div>
          <form action={logoutAction} method="POST" className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-50"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* main */}
      <div className="flex-1">
        <div className="border-b border-ink-100 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="font-serif text-xl font-semibold text-ink-900">
              {NAV.find((n) => n.href === active)?.label ?? "Dashboard"}
            </h1>
            {memorials[0] && (
              <a
                href={`/m/${memorials[0].slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-candle-700 hover:underline"
              >
                View live page ↗
              </a>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
