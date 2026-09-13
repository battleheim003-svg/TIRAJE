import { createClient, type RedisClientType } from "redis"

let clientInstance: RedisClientType | null = null

export function getRedisClient(): RedisClientType | null {
  const url = process.env.REDIS_URL
  if (!url) return null

  if (!clientInstance) {
    clientInstance = createClient({ url })
    clientInstance.on("error", (err) => {
      console.warn("[redis] Client error:", err)
    })
  }

  return clientInstance
}
