import "server-only";

import type { NextRequest } from "next/server";

// Best-effort in-memory rate limiting. Serverless instances are not shared
// and this map resets on cold start, so it does not guarantee a global
// limit — in production, back this with Vercel KV / Upstash Redis (or
// similar) for a real distributed limiter. Still meaningfully raises the
// cost of a brute-force or scraping attempt against a single warm instance.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  key: string,
  options: { windowMs: number; maxAttempts: number },
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > options.maxAttempts;
}

export function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
