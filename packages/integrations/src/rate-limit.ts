import { AppError } from "@tirajeh/shared"
import { getRedisClient } from "./redis"

/**
 * Sliding-window rate limiter backed by Redis.
 * Key format: `rl:<key>` — callers supply a namespaced key.
 */
export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number // 0 when ok === true
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`
  let client

  try {
    client = await getRedisClient()
  } catch (err) {
    if (err instanceof AppError) throw err
    if (process.env.NODE_ENV === "production") {
      throw new AppError("سرویس موقتاً در دسترس نیست", "SERVICE_UNAVAILABLE", 503)
    }
    console.warn(`[rate-limit] Redis not configured, bypassing rate limit for key: ${key}`)
    return { ok: true, remaining: limit, retryAfterSec: 0 }
  }

  try {


    const currentCount = await client.incr(redisKey)

    if (currentCount === 1) {
      await client.expire(redisKey, windowSec)
    }

    if (currentCount > limit) {
      const ttl = await client.ttl(redisKey)
      const retryAfterSec = ttl > 0 ? ttl : windowSec
      return {
        ok: false,
        remaining: 0,
        retryAfterSec,
      }
    }

    return {
      ok: true,
      remaining: Math.max(0, limit - currentCount),
      retryAfterSec: 0,
    }
  } catch (err) {
    if (err instanceof AppError) throw err

    console.warn(`[rate-limit] Redis operation failed for key: ${key}`, err)
    if (process.env.NODE_ENV === "production") {
      throw new AppError("سرویس موقتاً در دسترس نیست", "SERVICE_UNAVAILABLE", 503)
    }
    return { ok: true, remaining: limit, retryAfterSec: 0 }
  }
}
