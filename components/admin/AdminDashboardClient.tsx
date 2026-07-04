"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import type { AdminMemorial } from "@/lib/admin/types";
import DashboardHeader from "@/components/admin/DashboardHeader";
import MemorialsTable from "@/components/admin/MemorialsTable";
import CreateMemorialModal from "@/components/admin/CreateMemorialModal";

export default function AdminDashboardClient({
  memorials,
  appUrl,
}: {
  memorials: AdminMemorial[];
  appUrl: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-ink-50 to-white px-4 py-5 sm:px-6 sm:py-8">
      <Toaster position="top-right" richColors />
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader onCreate={() => setCreateOpen(true)} />
        <MemorialsTable memorials={memorials} appUrl={appUrl} />
      </div>

      <CreateMemorialModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
