"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CircleX, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createMemorialAction, type CreateMemorialResult } from "@/app/_admin/actions";

const initialState: CreateMemorialResult = { ok: false };

export default function CreateMemorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handledOkRef = useRef(false);
  const [state, formAction, isPending] = useActionState(createMemorialAction, initialState);

  useEffect(() => {
    if (open) {
      handledOkRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (state.ok && !handledOkRef.current) {
      handledOkRef.current = true;
      toast.success(
        `Memorial created. Send this login to customer: ${state.email} / ${state.tempPassword}`,
        { duration: 12000 },
      );
      formRef.current?.reset();
      onClose();
      router.refresh();
      return;
    }

    if (state.error) {
      toast.error(state.error);
    }
  }, [state, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-ink-900">
            <UserPlus size={18} />
            Create New Memorial
          </h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100">
            <CircleX size={18} />
          </button>
        </div>

        <form
          ref={formRef}
          action={formAction}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input name="customerName" required placeholder="Customer Name" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm" />
          <input name="customerEmail" type="email" required placeholder="Customer Email" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm" />
          <input name="memorialName" required placeholder="Memorial Name" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm sm:col-span-2" />
          <input name="dateOfBirth" type="date" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm" />
          <input name="dateOfDeath" type="date" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm" />
          <input name="tagline" placeholder="Tagline" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm sm:col-span-2" />
          <textarea name="bio" rows={4} placeholder="Bio" className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm sm:col-span-2" />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="mt-4 w-full rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
            >
              {isPending ? "Creating..." : "Create Memorial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
