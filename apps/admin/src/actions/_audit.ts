/**
 * Internal helper — not exported as a server action.
 * Called inside other admin actions to write to audit_logs.
 */
import { db } from "@tirajeh/database"
import { headers } from "next/headers"

type AuditParams = {
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export async function writeAuditLog(params: AuditParams) {
  const hdrs = await headers()
  const ipAddress =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    null
  const userAgent = hdrs.get("user-agent") ?? null

  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      oldValues: params.oldValues ?? null,
      newValues: params.newValues ?? null,
      ipAddress,
      userAgent,
    },
  })
}
