import { describe, it, expect } from "vitest"

describe("getRedisClient", () => {
  it("throws in production when REDIS_URL is not set", async () => {
    const orig = process.env.NODE_ENV
    const origUrl = process.env.REDIS_URL
    process.env.NODE_ENV = "production"
    delete process.env.REDIS_URL
    const { getRedisClient, closeRedisClient } = await import("../redis")
    await closeRedisClient()
    try {
      await getRedisClient()
      expect.unreachable("should have thrown")
    } catch (err: unknown) {
      const appErr = err as { code?: string; message?: string }
      expect(appErr.code).toBe("SERVICE_UNAVAILABLE")
      expect(appErr.message).toBe("Redis پیکربندی نشده")
    } finally {
      process.env.NODE_ENV = orig
      if (origUrl !== undefined) {
        process.env.REDIS_URL = origUrl
      }
    }
  })
})
