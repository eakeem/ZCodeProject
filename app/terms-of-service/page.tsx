import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Terms of Service · Memforial" };

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-ink-400">Last updated: July 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-600">
          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or using Memforial (&quot;the Service&quot;), you
              agree to these Terms of Service. If you do not agree, please do
              not use the Service. These terms are governed by the laws of
              Jamaica.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              2. The Service
            </h2>
            <p>
              Memforial provides online memorial pages where families and
              friends can share photos, leave tributes, and light virtual
              candles in memory of loved ones. We reserve the right to modify
              or discontinue features at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              3. Eligibility
            </h2>
            <p>
              You must be at least 18 years old to create an account. By
              registering, you confirm that all information you provide is
              accurate and that you have the authority to act on behalf of the
              deceased&apos;s family where applicable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              4. Account Responsibilities
            </h2>
            <ul className="list-disc space-y-1 pl-5">
               <li>All memorial accounts are created and managed by the MEMFORIAL team on behalf of the deceased's family.</li>
    <li>Families will receive access to view and share their memorial page, but login credentials remain with MEMFORIAL staff.</li>
    <li>Any changes, updates, or requests to the memorial must be made through the MEMFORIAL team at memforial@gmail.com</li>
    <li>MEMFORIAL is responsible for the security of all account credentials and access.</li>
    <li>Account access may be transferred to a family member upon written request and verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Upload content that is false, offensive, or harmful.</li>
              <li>Impersonate any person or organisation.</li>
              <li>Use the Service to harass, threaten, or defame others.</li>
              <li>
                Upload material that infringes any copyright, trademark, or
                other intellectual property right.
              </li>
              <li>
                Attempt to gain unauthorised access to any part of the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              6. Content Ownership &amp; Moderation
            </h2>
            <p>
              You retain ownership of content you upload. By uploading, you
              grant Memforial a non-exclusive licence to display that content
              on the platform. All tributes and shared photos are moderated
              before publication. We reserve the right to remove any content
              that violates these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              7. Payments &amp; Subscriptions
            </h2>
            <p>
              Paid plans are billed through Stripe. All prices are in Jamaican
              Dollars (JMD) or as otherwise stated at checkout. Refunds are
              considered on a case-by-case basis — contact us within 14 days
              of a charge if you believe an error occurred. We reserve the
              right to change pricing with 30 days&apos; notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              8. Termination
            </h2>
            <p>
              We may suspend or terminate your account if you breach these
              Terms. You may close your account at any time by contacting us.
              On termination, your memorial pages and associated data may be
              permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              9. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by Jamaican law, Memforial is not
              liable for any indirect, incidental, or consequential damages
              arising from your use of the Service. The Service is provided
              &quot;as is&quot; without warranty of any kind.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              10. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of Jamaica. Any disputes shall be subject to the exclusive
              jurisdiction of the courts of Jamaica.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              11. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of
              the Service after changes constitutes acceptance of the revised
              Terms. We will notify you of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-xl font-semibold text-ink-800">
              12. Contact
            </h2>
            <p>
              Questions about these Terms? Email us at{" "}
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
          <Link href="/privacy-policy" className="underline hover:text-ink-600">
            View Privacy Policy →
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
