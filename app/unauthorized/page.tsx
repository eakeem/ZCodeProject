import Link from "next/link";

export const metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink-900">
          Admin access only
        </h1>
        <p className="mt-3 text-ink-500">
          You do not have permission to view the admin dashboard.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ink-50 transition hover:bg-ink-800"
        >
          Return to login
        </Link>
      </div>
    </main>
  );
}
