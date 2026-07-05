import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"),
  analytics: true,
});

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
 */
export async function checkRateLimit(
  memorialId: string,
  type: "tribute" | "photo",
): Promise<{ error: string } | null> {
  const ip = await getIP();
  const identifier = `${ip}:${memorialId}:${type}`;
  const { success } = await ratelimit.limit(identifier);
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
