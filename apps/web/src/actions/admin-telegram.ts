"use server"

import { db, Prisma } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { parseAction } from "@/lib/parse-action"
import { audit } from "@/lib/audit"
import { z } from "zod"

// ─── 1. Outbox Items ───────────────────────────────────────────────────────

const OutboxFilterSchema = z.object({
  status: z.enum(["PENDING", "SENT", "FAILED", "DEAD", "ALL"]).default("ALL"),
  channel: z
    .enum(["tg_channel", "tg_admin", "tg_user", "email", "ALL"])
    .default("ALL"),
  page: z.coerce.number().int().positive().default(1),
})

export interface OutboxItem {
  id: string
  event: string
  channel: string
  status: string
  attempts: number
  runAfter: string // ISO
  lastError: string | null
  sentAt: string | null
  createdAt: string // ISO
}

export async function getOutboxItemsAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.TELEGRAM_MANAGE)

  const parsed = parseAction(OutboxFilterSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { status, channel, page } = parsed.data
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where: Prisma.OutboxWhereInput = {}

  if (status !== "ALL") {
    where.status = status
  }

  if (channel !== "ALL") {
    where.channel = channel
  }

  const [items, total] = await Promise.all([
    db.outbox.findMany({
      where,
      select: {
        id: true,
        event: true,
        channel: true,
        status: true,
        attempts: true,
        runAfter: true,
        lastError: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.outbox.count({ where }),
  ])

  const formattedItems: OutboxItem[] = items.map((i) => ({
    id: i.id,
    event: i.event,
    channel: i.channel,
    status: i.status,
    attempts: i.attempts,
    runAfter: i.runAfter.toISOString(),
    lastError: i.lastError,
    sentAt: i.sentAt ? i.sentAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
  }))

  return {
    ok: true,
    success: true,
    data: {
      items: formattedItems,
      total,
      pageSize,
    },
  }
}

// ─── 2. Retry Outbox Item ──────────────────────────────────────────────────

const RetrySchema = z.object({
  outboxId: z.string().uuid("شناسه پیام نامعتبر است"),
})

export async function retryOutboxItemAction(input: unknown) {
  const user = await requireAdminPerm(PERMISSIONS.TELEGRAM_MANAGE)

  const parsed = parseAction(RetrySchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { outboxId } = parsed.data

  const item = await db.outbox.findUnique({
    where: { id: outboxId },
    select: { id: true, status: true },
  })

  if (!item) {
    return { ok: false, success: false, error: "پیام در صندوق خروجی یافت نشد" }
  }

  if (item.status !== "FAILED" && item.status !== "DEAD") {
    return {
      ok: false,
      success: false,
      error: "فقط آیتم‌های FAILED یا DEAD قابل ارسال دوباره هستند",
    }
  }

  await db.outbox.update({
    where: { id: outboxId },
    data: {
      status: "PENDING",
      attempts: 0,
      runAfter: new Date(),
      lastError: null,
    },
  })

  try {
    await audit({
      userId: user.id,
      action: "OUTBOX_RETRY",
      resource: "Outbox",
      resourceId: outboxId,
      before: { status: item.status },
      after: { status: "PENDING" },
    })
  } catch (e) {
    console.error("[audit] outbox retry:", e)
  }

  revalidatePath("/admin/telegram")

  return { ok: true, success: true }
}

// ─── 3. Scheduled Posts ────────────────────────────────────────────────────

export interface ScheduledPost {
  id: string
  event: string
  channel: string
  runAfter: string // ISO
  createdAt: string
}

export async function getScheduledPostsAction() {
  await requireAdminPerm(PERMISSIONS.TELEGRAM_MANAGE)

  const now = new Date()
  const sixtyDaysAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const posts = await db.outbox.findMany({
    where: {
      status: "PENDING",
      runAfter: {
        gt: now,
        lte: sixtyDaysAhead,
      },
      channel: {
        startsWith: "tg",
      },
    },
    select: {
      id: true,
      event: true,
      channel: true,
      runAfter: true,
      createdAt: true,
    },
    orderBy: { runAfter: "asc" },
  })

  const formatted: ScheduledPost[] = posts.map((p) => ({
    id: p.id,
    event: p.event,
    channel: p.channel,
    runAfter: p.runAfter.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }))

  return {
    ok: true,
    success: true,
    data: formatted,
  }
}

// ─── 4. Telegram Log ───────────────────────────────────────────────────────

const LogFilterSchema = z.object({
  channel: z.enum(["tg_channel", "tg_admin", "tg_user", "ALL"]).default("ALL"),
  page: z.coerce.number().int().positive().default(1),
})

export interface TelegramLogItem {
  id: string
  channel: string
  event: string
  chatId: string
  status: string
  errorMessage: string | null
  sentAt: string
}

export async function getTelegramLogAction(input: unknown) {
  await requireAdminPerm(PERMISSIONS.TELEGRAM_MANAGE)

  const parsed = parseAction(LogFilterSchema, input)
  if ("error" in parsed) {
    return { ok: false, success: false, error: parsed.error.error }
  }

  const { channel, page } = parsed.data
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where: Prisma.TelegramLogWhereInput = {}

  if (channel !== "ALL") {
    where.channelId = { contains: channel }
  }

  const [logs, total] = await Promise.all([
    db.telegramLog.findMany({
      where,
      select: {
        id: true,
        channelId: true,
        entityType: true,
        entityId: true,
        status: true,
        errorMessage: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.telegramLog.count({ where }),
  ])

  const items: TelegramLogItem[] = logs.map((l) => ({
    id: l.id,
    channel: l.channelId,
    event: l.entityType,
    chatId: l.channelId,
    status: l.status,
    errorMessage: l.errorMessage,
    sentAt: (l.sentAt ?? l.createdAt).toISOString(),
  }))

  return {
    ok: true,
    success: true,
    data: {
      items,
      total,
    },
  }
}
