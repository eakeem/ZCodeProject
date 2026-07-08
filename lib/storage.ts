// ============================================================
// Supabase Storage helpers — image uploads for both the family
// gallery (/api/upload) and visitor shared photos
// (/api/shared-photos). Server-only: uses the service role key.
//
// Buckets (create in the Supabase dashboard → Storage):
//   • "memorial"        — family gallery uploads
//   • "shared-photos"   — visitor-submitted photos
// Both should be PUBLIC buckets.
//
// Falls back gracefully when Supabase isn't configured: upload
// routes detect this and return a clear error instead of crashing.
// ============================================================

import { createClient } from "@supabase/supabase-js";
// sharp is intentionally NOT imported at module level — a top-level ES import
// causes webpack to include it in its shared server module graph, which crashes
// any route that doesn't explicitly declare runtime = "nodejs" (e.g. the
// visitor memorial page). We require() it lazily inside uploadImage() instead,
// which keeps it out of webpack's static dependency tree entirely.
// eslint-disable-next-line @typescript-eslint/no-require-imports
type Sharp = typeof import('sharp');

// 10 MB upload cap — applies to both flows. Visitor uploads are also
// MIME-checked against the allow-list below.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export interface UploadResult {
  url: string; // public URL served by Supabase Storage
  path: string; // object path within the bucket (for deletion)
  bucket: string;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Validate an uploaded image blob. Throws on an invalid MIME type or
 * a file larger than MAX_UPLOAD_BYTES. Used for untrusted visitor
 * uploads; the family flow relies on the same checks for safety.
 */
export function validateImageUpload(file: File): void {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WebP, GIF, or AVIF image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That image is larger than 10MB. Please choose a smaller file.");
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

/**
 * Upload an image to the given bucket, compressing it with sharp first.
 * The image is always converted to JPEG at quality 75, resized to a
 * maximum of 1600x1600 (preserving aspect ratio), and EXIF-rotated.
 * The object path is namespaced under the memorial id and suffixed with
 * a timestamp + random token so paths are unguessable.
 */
export async function uploadImage(
  file: File | Blob,
  memorialId: string,
  bucket: "memorial" | "shared-photos",
): Promise<UploadResult> {
  // Output is always JPEG after compression.
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const objectPath = `${memorialId}/${stamp}.jpg`;

  console.log(`[storage] UPLOAD ROUTE HIT — bucket: ${bucket}`);

  // Lazy-require sharp so webpack never sees it as a static import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sharp = (require('sharp') as Sharp).default ?? require('sharp') as Sharp;

  const rawBytes = Buffer.from(await file.arrayBuffer());
  console.log(`[storage] Original: ${rawBytes.length} bytes`);
  console.log(`[storage] Input first 4 bytes: ${rawBytes.slice(0, 4).toString('hex')} (valid JPEG: ${rawBytes[0] === 0xFF && rawBytes[1] === 0xD8})`);

  const compressedBytes = await sharp(rawBytes)
    .rotate()                          // auto-orient from EXIF
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  console.log(
    `[storage] Original: ${rawBytes.length} Compressed: ${compressedBytes.length}` +
    ` (${((1 - compressedBytes.length / rawBytes.length) * 100).toFixed(1)}% reduction)`,
  );
  console.log(`[storage] Output first 4 bytes: ${compressedBytes.slice(0, 4).toString('hex')} (valid JPEG: ${compressedBytes[0] === 0xFF && compressedBytes[1] === 0xD8})`);

  if (!isStorageConfigured()) {
    // Local dev fallback: return a data URL of the compressed bytes.
    const dataUrl = `data:image/jpeg;base64,${compressedBytes.toString("base64")}`;
    return { url: dataUrl, path: objectPath, bucket };
  }

  // Bypass the Supabase storage-js SDK upload method entirely and use a
  // direct HTTP POST to the Storage REST API.  The SDK's uploadOrUpdate()
  // wraps Blob/File bodies in FormData (which can corrupt binary in some
  // Node runtimes), and its internal fetch abstraction has had breaking
  // changes across versions.  A raw fetch with the Buffer as the body is
  // guaranteed to send exact binary bytes regardless of SDK version or
  // Node.js release (18 / 20 / 22 / 24).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
      "cache-control": "3600",
    },
    // Passing a Buffer (Uint8Array subclass) as the body tells Node.js fetch
    // to send raw binary with no encoding transformation.
    body: compressedBytes,
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(
      humanizeStorageError(
        { message: body.message ?? body.error, statusCode: uploadRes.status },
        bucket,
      ),
    );
  }

  // getPublicUrl just constructs a URL — no network call.
  const supabase = adminClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return { url: data.publicUrl, path: objectPath, bucket };
}

/**
 * Turn opaque Supabase/Node storage errors into a message a user can
 * act on. Handles the two most common failure modes:
 *   • missing bucket  → "Bucket not found" (Supabase message)
 *   • network failure → Node's fetch throws the bare string
 *     "fetch failed" (often an IPv6/connectivity issue to the
 *     Cloudflare-fronted Storage host).
 */
function humanizeStorageError(
  error: { message?: string; statusCode?: string | number },
  bucket: string,
): string {
  const msg = (error.message || "").toLowerCase();
  const code = error.statusCode;
  // 404 from the storage API == the bucket doesn't exist.
  if (code === "404" || msg.includes("bucket not found") || msg.includes("not found")) {
    return `Could not upload: the "${bucket}" bucket does not exist in Supabase Storage. Create it (as a PUBLIC bucket) in your Supabase dashboard → Storage.`;
  }
  if (msg.includes("fetch failed") || msg.includes("timeout") || msg.includes("econnreset")) {
    return "Could not reach Supabase Storage (network timeout). This is often a broken IPv6 connection — set NEXT_CONFIG_DNS_RESULT_ORDER=ipv4first or NODE_OPTIONS=--dns-result-order=ipv4first, and check your network/proxy.";
  }
  return error.message || "Image upload failed.";
}

/**
 * Remove an object from a bucket. Called when a shared photo is
 * hard-deleted so storage doesn't accumulate orphaned files.
 * Failures are swallowed — a missing object shouldn't break a delete.
 */
export async function deleteImage(
  objectPath: string,
  bucket: "memorial" | "shared-photos",
): Promise<void> {
  if (!isStorageConfigured() || !objectPath) return;
  const supabase = adminClient();
  await supabase.storage.from(bucket).remove([objectPath]);
}

/**
 * Extract the object path from a Supabase Storage public URL, so it
 * can be passed to deleteImage(). Returns null for foreign URLs.
 */
export function pathFromPublicUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return u.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}
