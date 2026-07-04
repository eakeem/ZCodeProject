"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, PencilLine, QrCode } from "lucide-react";
import type { AdminMemorial } from "@/lib/admin/types";
import QrLinkModal from "@/components/admin/QrLinkModal";

function formatDateUTC(value: string) {
  const d = new Date(value);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function MemorialsTable({
  memorials,
  appUrl,
}: {
  memorials: AdminMemorial[];
  appUrl: string;
}) {
  const [modalUrl, setModalUrl] = useState<string>("");

  const rows = useMemo(() => memorials, [memorials]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const publicUrl = `${appUrl}/memorial/${item.slug}`;
                return (
                  <tr key={item.id} className="border-t border-ink-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{item.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatDateUTC(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-ink-100 text-ink-600"
                        }`}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/select/${item.user_id}?redirect=/admin/memorial`}
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                        >
                          <PencilLine size={13} /> Edit
                        </Link>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                        >
                          <ExternalLink size={13} /> View
                        </a>
                        <button
                          type="button"
                          onClick={() => setModalUrl(publicUrl)}
                          className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-ink-800"
                        >
                          <QrCode size={13} /> Get QR + Link
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-500">
                    No memorials yet. Use Create New Memorial to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QrLinkModal open={Boolean(modalUrl)} onClose={() => setModalUrl("")} publicUrl={modalUrl} />
    </>
  );
}
