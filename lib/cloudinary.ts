// ============================================================
// Cloudinary helpers — image uploads + a signed upload URL the
// browser can POST to directly. Falls back gracefully when
// Cloudinary isn't configured (see api/upload route).
// ============================================================

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Build a Cloudinary URL with on-the-fly transformations
 * (resize/crop/quality). Works for any Cloudinary-hosted image.
 * If the URL isn't a Cloudinary asset, it's returned unchanged.
 */
export function optimize(
  url: string,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return url;
  const marker = `/res.cloudinary.com/${cloudName}/image/upload/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const prefix = url.slice(0, idx + marker.length);
  const publicPart = url.slice(idx + marker.length);
  // strip an existing transformation if present (everything before last "/")
  const parts = publicPart.split("/");
  // if first segment looks like a transform (contains ','), drop it
  const cleanParts = parts[0].includes(",") ? parts.slice(1) : parts;
  const transform = [
    opts.width ? `w_${opts.width}` : null,
    opts.height ? `h_${opts.height}` : null,
    "c_fill",
    `q_${opts.quality ?? "auto"}`,
    "f_auto",
  ]
    .filter(Boolean)
    .join(",");
  return prefix + transform + "/" + cleanParts.join("/");
}

/**
 * Server-side: generate a signed params for a direct browser
 * upload (for a logged-in tenant). Returns the upload URL + the
 * signature payload.
 */
export async function buildUploadSignature(folder = "memorial"): Promise<{
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
} | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  // Node 18+ global fetch has no FormData; use the crypto signer.
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}
