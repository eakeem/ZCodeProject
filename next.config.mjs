/** @type {import('next').NextConfig} */

// Resolve hostnames IPv4-first. Supabase (and many CDNs) sit behind
// Cloudflare, which advertises AAAA records. On networks with broken
// or filtered IPv6, Node's fetch (undici) tries the IPv6 address first
// and hangs ~10s until its connect timeout fires "fetch failed".
// Forcing ipv4first makes server-side fetch to these hosts reliable.
// (Applies to Node's resolver globally for this process.)
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

const nextConfig = {
  reactStrictMode: true,
  // Supabase Storage (uploaded images) + common image hosts whitelisted for next/image.
  // The literal "<project>" is a placeholder — replace with your Supabase project ref,
  // or use a wider match (e.g. ".supabase.co") when you create the bucket.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  // `stripe` is an OPTIONAL production dependency loaded only at runtime
  // in server routes, after its env vars are checked (see isStripeConfigured).
  // Listing it here tells Next/Turbopack to treat it as a runtime `require`
  // rather than bundling it — so the app still builds when it isn't installed,
  // and only resolves it at runtime when actually used.
  serverExternalPackages: ["stripe"],
};

export default nextConfig;
