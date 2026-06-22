/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudinary + common image hosts whitelisted for next/image
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  // `stripe`, `cloudinary`, and `@supabase/supabase-js` are OPTIONAL
  // production dependencies loaded only at runtime in server routes,
  // and only after their env vars are checked (see isStripeConfigured /
  // isCloudinaryConfigured). Listing them here tells Next/Turbopack to
  // treat them as runtime `require`s rather than bundling them — so the
  // app still builds when they aren't installed, and only resolves them
  // at runtime when actually used. (Next 16 uses Turbopack by default,
  // which replaced the old webpack-externals setup with this option.)
  serverExternalPackages: ["stripe", "cloudinary"],
};

export default nextConfig;
