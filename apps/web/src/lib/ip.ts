import { headers } from "next/headers"

/**
 * Extract client IP from headers (x-forwarded-for, x-real-ip, etc.)
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    const xff = h.get("x-forwarded-for")
    if (xff) {
      const first = xff.split(",")[0]?.trim()
      if (first) return first
    }
    const realIp = h.get("x-real-ip")?.trim()
    if (realIp) return realIp
    return "127.0.0.1"
  } catch {
    return "127.0.0.1"
  }
}
