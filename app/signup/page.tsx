import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🕯️</span>
            <span className="font-serif text-xl font-semibold text-ink-900">
              Memorial
            </span>
          </Link>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-semibold text-ink-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Start a memorial in minutes. It's free.
          </p>
          <div className="mt-6">
            {/* AuthForm uses useSearchParams(); it must sit inside a
                Suspense boundary so the page can be statically rendered. */}
            <Suspense fallback={null}>
              <AuthForm mode="signup" />
            </Suspense>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-candle-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
