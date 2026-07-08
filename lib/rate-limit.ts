import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

function isRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

// Lazily initialised so the module doesn't crash at import time when
// the env vars aren't set (e.g. local dev without an Upstash account).
let _ratelimit: Ratelimit | null = null;
function getRatelimit(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(1, "60 s"),
      analytics: true,
    });
  }
  return _ratelimit;
}

async function getIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

/**
 * Returns an error object if the IP has exceeded 1 request per 60 s for this
 * memorial + type combination, or null if the request is allowed.
 * Skips rate limiting silently when Upstash env vars are not configured.
 */
export async function checkRateLimit(
  memorialId: string,
  type: "tribute" | "photo",
): Promise<{ error: string } | null> {
  if (!isRateLimitConfigured()) return null;
  const ip = await getIP();
  const identifier = `${ip}:${memorialId}:${type}`;
  const { success } = await getRatelimit().limit(identifier);
  if (!success) {
    return {
      error:
        type === "tribute"
          ? "You can only share 1 tribute every 60 seconds for this memorial."
          : "You can only upload 1 photo every 60 seconds for this memorial.",
    };
  }
  return null;
}
