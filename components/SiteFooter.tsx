import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕯️</span>
            <span className="font-serif text-xl font-semibold text-ink-900">
              Memoforial 
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            Celebrating lives, together.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-ink-800">Memorials</h4>
          <ul className="mt-3 space-y-2 text-ink-500">
            <li>
              <Link href="/pricing" className="hover:text-ink-800">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-ink-800">Account</h4>
          <ul className="mt-3 space-y-2 text-ink-500">
            <li>
              <Link href="/login" className="hover:text-ink-800">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-ink-800">
                Admin dashboard
              </Link>
            </li>
            <li>
              <Link href="mailto:Memforial@gmail.com" className="hover:text-ink-800">
                Memforial@gmail.com
              </Link>
            </li>
            <li>
              <Link href="https://www.instagram.com/memforial?utm_source=qr" className="hover:text-ink-800">
                Instagram Memforial
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()}  Memforial. All rights reserved. By Ellis NT
      </div>
    </footer>
  );
}
