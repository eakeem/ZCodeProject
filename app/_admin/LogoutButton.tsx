"use client";
import { useRouter } from "next/navigation";
import { logoutAndRedirect } from "@/app/admin/actions";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await logoutAndRedirect();
        router.push("/login");
        router.refresh();
      }}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-50"
    >
      Log out
    </button>
  );
}