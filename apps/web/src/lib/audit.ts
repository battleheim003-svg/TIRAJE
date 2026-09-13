import { db, Prisma } from "@tirajeh/database"
import { headers } from "next/headers"

export interface AuditParams {
  userId: string
  action: string
  resource: string
  resourceId?: string
  before?: unknown
  after?: unknown
  ip?: string | null
}

async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  } catch {
    return null
  }
}

async function getUserAgent(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get("user-agent") ?? null
  } catch {
    return null
  }
}

function toPrismaJson(val: unknown): Prisma.InputJsonValue | undefined {
  if (val === undefined) return undefined
  try {
    return JSON.parse(JSON.stringify(val)) as Prisma.InputJsonValue
  } catch {
    return String(val) as Prisma.InputJsonValue
  }
}

export async function audit(params: {
  userId: string
  action: string
  resource: string
  resourceId?: string
  before?: unknown
  after?: unknown
  ip?: string | null
}): Promise<void> {
  try {
    const ip = params.ip !== undefined ? params.ip : await getClientIp()
    const userAgent = await getUserAgent()

    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        oldValues: toPrismaJson(params.before),
        newValues: toPrismaJson(params.after),
        ipAddress: ip,
        userAgent,
      },
    })
  } catch (err) {
    console.error("[audit] Failed to create audit log:", err)
  }
}
