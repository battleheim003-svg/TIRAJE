import { timingSafeEqual } from "crypto"

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail-closed: نبود secret = رد
  const header = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  try {
    const a = Buffer.from(secret)
    const b = Buffer.from(header)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function cronUnauthorizedResponse(): Response {
  const secret = process.env.CRON_SECRET
  return new Response(
    JSON.stringify({ error: secret ? "Unauthorized" : "CRON_SECRET not configured" }),
    {
      status: secret ? 401 : 503,
      headers: { "Content-Type": "application/json" },
    }
  )
}
