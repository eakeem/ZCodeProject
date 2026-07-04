"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";

export default function QrLinkModal({
  open,
  onClose,
  publicUrl,
}: {
  open: boolean;
  onClose: () => void;
  publicUrl: string;
}) {
  const normalizedUrl = useMemo(() => publicUrl.trim(), [publicUrl]);

  if (!open) return null;

  async function copyLink() {
    await navigator.clipboard.writeText(normalizedUrl);
    toast.success("Public memorial link copied.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">Get QR + Link</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs text-ink-700 break-all">{normalizedUrl}</div>

        <div className="mt-4 flex justify-center rounded-xl border border-ink-100 bg-white p-4">
          <QRCodeSVG value={normalizedUrl} size={180} includeMargin />
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
        >
          <Link2 size={15} />
          Copy Link
        </button>
      </div>
    </div>
  );
}
