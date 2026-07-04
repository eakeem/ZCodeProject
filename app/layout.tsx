import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Memorial — Honouring lives, together",
    template: "%s · Memorial",
  },
  description:
    "Create a beautiful memorial page to honour a loved one. Share photos, gather tributes, and light virtual candles.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  openGraph: {
    title: "Memorial — Honouring lives, together",
    description:
      "Create a beautiful memorial page to honour a loved one. Tributes, virtual candles, and a place for family to gather.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50 font-sans text-ink-800 antialiased">
        {children}
      </body>
    </html>
  );
}
