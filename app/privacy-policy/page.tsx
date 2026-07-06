import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Privacy Policy · Memforial" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: July 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              1. Who We Are
            </h2>
            <p>
              Memforial (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an online memorial platform
              operated in Jamaica. We are committed to protecting the personal
              information of our users in accordance with the{" "}
              <strong>Data Protection Act, 2020 (Jamaica)</strong>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              2. Information We Collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Account details: name, email address, and password.</li>
              <li>Memorial content: photos, tributes, and written messages you upload.</li>
              <li>Usage data: pages visited, device type, and IP address.</li>
              <li>Payment information: processed securely through Stripe; we do not store card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To create and manage your memorial pages.</li>
              <li>To process payments and send receipts.</li>
              <li>To moderate tributes and shared photos.</li>
              <li>To improve our service and fix technical issues.</li>
              <li>To respond to your support requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              4. Sharing Your Information
            </h2>
            <p>
              We do not sell your personal data. We may share it with trusted
              third-party providers (such as Supabase for database hosting and
              Stripe for payments) solely to operate the platform. All providers
              are required to handle your data securely.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              5. Memorial Content Visibility
            </h2>
            <p>
              Memorial pages are publicly accessible by default via their unique
              link. Photos and tributes submitted by visitors are moderated
              before appearing on a page. You, as the account holder, control
              what content is displayed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              6. Data Retention
            </h2>
            <p>
              We retain your account and memorial data for as long as your
              account is active. You may request deletion of your account and
              associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              7. Your Rights
            </h2>
            <p>
              Under Jamaica&apos;s Data Protection Act you have the right to access,
              correct, or request deletion of your personal data. To exercise
              these rights, email us at{" "}
              <a
                href="mailto:Memforial@gmail.com"
                className="underline hover:text-ink-900"
              >
                Memforial@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              8. Cookies
            </h2>
            <p>
              We use essential session cookies to keep you logged in. No
              third-party advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. Significant changes
              will be communicated via email or a notice on this page.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              10. Contact
            </h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a
                href="mailto:Memforial@gmail.com"
                className="underline hover:text-ink-900"
              >
                Memforial@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-12 text-xs text-ink-400">
          Governed by the laws of Jamaica.{" "}
          <Link href="/terms-of-service" className="underline hover:text-ink-600">
            View Terms of Service →
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
