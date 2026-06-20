import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <span className="text-5xl">🕯️</span>
      <h1 className="mt-6 font-serif text-4xl font-semibold text-ink-900">
        Page not found
      </h1>
      <p className="mt-3 text-ink-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ink-50 hover:bg-ink-800"
      >
        Return home
      </Link>
    </main>
  );
}
