import Link from "next/link";
import { LogOut, PlusCircle } from "lucide-react";

export default function DashboardHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Memforial Admin</h1>
          <p className="text-sm text-ink-500">Manage customer memorial pages, publish updates, and share links.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            <PlusCircle size={16} />
            Create New Memorial
          </button>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
