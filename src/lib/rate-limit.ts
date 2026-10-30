import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { assertProductionEnv } from "@/lib/runtime-config";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

if (!redis && process.env.NODE_ENV !== "test") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set - rate limiting is disabled (fail-open). Set these in production."
  );
}

function createLimiter(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "ratelimit",
    analytics: true,
  });
}

// Deliberately conservative limits for auth/payment endpoints - tuned to
// stop scripted abuse (credential stuffing, signup spam, checkout abuse)
// without getting in the way of a real user who mistypes a password.
export const limiters = {
  login: createLimiter(5, "15 m"),
  signup: createLimiter(5, "1 h"),
  resendCode: createLimiter(1, "60 s"),
  forgotPassword: createLimiter(3, "15 m"),
  checkout: createLimiter(3, "10 s"),
} as const;

export async function checkRateLimit(limiter: Ratelimit | null, identifier: string) {
  if (process.env.NODE_ENV === "production" && !limiter) {
    assertProductionEnv();
  }

  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return limiter.limit(identifier);
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
