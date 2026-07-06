import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-serif text-2xl font-extrabold tracking-wide text-ink-900">
              <span className="text-[#E63946]">MEM</span>
              <span className="text-[#1D3557]">FORIAL</span>
            </span>
          </Link>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold text-ink-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Log in to manage your memorial.
          </p>
          <div className="mt-6">
            {/* AuthForm uses useSearchParams(); it must sit inside a
                Suspense boundary so the page can be statically rendered. */}
            <Suspense fallback={null}>
              <AuthForm />
            </Suspense>
          </div>
        </div>
        
      </div>
    </main>
  );
}
