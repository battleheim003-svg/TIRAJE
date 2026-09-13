import { describe, it, expect, vi, beforeEach } from "vitest"
import { rateLimit } from "../rate-limit"
import * as redisModule from "../redis"
import { AppError } from "@tirajeh/shared"
import type { RedisClientType } from "redis"

describe("rateLimit", () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NODE_ENV = "test"
  })

  it("returns ok: true when within limit and sets expire on first request", async () => {
    const mockClient = {
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(true),
      ttl: vi.fn().mockResolvedValue(900),
    }

    vi.spyOn(redisModule, "getRedisClient").mockReturnValue(mockClient as unknown as RedisClientType)

    const res = await rateLimit("test:ip:127.0.0.1", 5, 900)

    expect(mockClient.incr).toHaveBeenCalledWith("rl:test:ip:127.0.0.1")
    expect(mockClient.expire).toHaveBeenCalledWith("rl:test:ip:127.0.0.1", 900)
    expect(res).toEqual({
      ok: true,
      remaining: 4,
      retryAfterSec: 0,
    })
  })

  it("returns ok: false when count exceeds limit with retryAfterSec from TTL", async () => {
    const mockClient = {
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      incr: vi.fn().mockResolvedValue(6),
      expire: vi.fn().mockResolvedValue(true),
      ttl: vi.fn().mockResolvedValue(750),
    }

    vi.spyOn(redisModule, "getRedisClient").mockReturnValue(mockClient as unknown as RedisClientType)

    const res = await rateLimit("test:ip:127.0.0.1", 5, 900)

    expect(mockClient.incr).toHaveBeenCalledWith("rl:test:ip:127.0.0.1")
    expect(mockClient.expire).not.toHaveBeenCalled()
    expect(mockClient.ttl).toHaveBeenCalledWith("rl:test:ip:127.0.0.1")
    expect(res).toEqual({
      ok: false,
      remaining: 0,
      retryAfterSec: 750,
    })
  })

  it("bypasses when Redis client is not available in development/test", async () => {
    process.env.NODE_ENV = "development"
    vi.spyOn(redisModule, "getRedisClient").mockReturnValue(null)

    const res = await rateLimit("test:ip:127.0.0.1", 5, 900)

    expect(res).toEqual({
      ok: true,
      remaining: 5,
      retryAfterSec: 0,
    })
  })

  it("throws AppError 503 when Redis client is not available in production", async () => {
    process.env.NODE_ENV = "production"
    vi.spyOn(redisModule, "getRedisClient").mockReturnValue(null)

    await expect(rateLimit("test:ip:127.0.0.1", 5, 900)).rejects.toThrow(AppError)
    try {
      await rateLimit("test:ip:127.0.0.1", 5, 900)
    } catch (err: unknown) {
      const appErr = err as AppError
      expect(appErr.statusCode).toBe(503)
      expect(appErr.code).toBe("SERVICE_UNAVAILABLE")
    }
  })

  it("throws AppError 503 when Redis operation fails in production", async () => {
    process.env.NODE_ENV = "production"
    const mockClient = {
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      incr: vi.fn().mockRejectedValue(new Error("Connection lost")),
      expire: vi.fn(),
      ttl: vi.fn(),
    }

    vi.spyOn(redisModule, "getRedisClient").mockReturnValue(mockClient as unknown as RedisClientType)

    await expect(rateLimit("test:ip:127.0.0.1", 5, 900)).rejects.toThrow(AppError)
  })
})
