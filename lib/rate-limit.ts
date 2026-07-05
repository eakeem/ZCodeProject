import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const tributeLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"),
});

const photoLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"),
});

async function getIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function checkTributeRateLimit(
  memorialId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const ip = await getIP();
  const identifier = `${ip}:${memorialId}:tribute`;
  const { success } = await tributeLimit.limit(identifier);
  if (!success) {
    return {
      success: false,
      error: "You can only share 1 tribute every 60 seconds for this memorial.",
    };
  }
  return { success: true };
}

export async function checkPhotoRateLimit(
  memorialId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const ip = await getIP();
  const identifier = `${ip}:${memorialId}:photo`;
  const { success } = await photoLimit.limit(identifier);
  if (!success) {
    return {
      success: false,
      error: "You can only upload 1 photo every 60 seconds for this memorial.",
    };
  }
  return { success: true };
}
