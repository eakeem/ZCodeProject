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
  // `stripe`, `@supabase/supabase-js`, and `cloudinary` are OPTIONAL
  // production dependencies loaded only at runtime in server routes.
  // Marking them as webpack externals means the build never tries to
  // bundle them, so the app builds & runs even before they're installed.
  // They're required lazily (computed specifier) inside lib/*.ts.
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      externals.push(({ request }, callback) => {
        if (
          request === "stripe" ||
          request === "@supabase/supabase-js" ||
          request === "cloudinary"
        ) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
      config.externals = externals;
    }
    return config;
  },
};

export default nextConfig;
