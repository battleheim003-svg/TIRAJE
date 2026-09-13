import { createClient, type RedisClientType } from "redis"
import { AppError } from "@tirajeh/shared"

let _client: RedisClientType | null = null
let _connecting = false

export async function getRedisClient(): Promise<RedisClientType> {
  if (_client?.isReady) return _client

  if (_connecting) {
    // صبر تا اتصال برقرار شود
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (_client?.isReady || !_connecting) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
    if (_client?.isReady) return _client
  }

  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Redis پیکربندی نشده", "SERVICE_UNAVAILABLE", 503)
    }
    throw new Error("[redis] REDIS_URL is not set (development: set it to redis://localhost:6379)")
  }

  _connecting = true
  const client = createClient({ url: process.env.REDIS_URL }) as RedisClientType

  client.on("error", (err) => {
    console.error("[redis] client error", err)
  })

  await client.connect()
  _client = client
  _connecting = false
  return _client
}

/** فقط برای تست */
export async function closeRedisClient(): Promise<void> {
  if (_client) {
    await _client.quit()
    _client = null
  }
}
