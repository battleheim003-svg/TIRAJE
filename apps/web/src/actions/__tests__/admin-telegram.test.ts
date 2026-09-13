import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb, mockRequireAdminPerm, mockAudit } = vi.hoisted(() => {
  return {
    mockDb: {
      outbox: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      telegramLog: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
    mockRequireAdminPerm: vi.fn(),
    mockAudit: vi.fn(),
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
  Prisma: {},
}))

vi.mock("@/lib/admin-guard", () => ({
  requireAdminPerm: (...args: unknown[]) => mockRequireAdminPerm(...args),
}))

vi.mock("@/lib/audit", () => ({
  audit: (...args: unknown[]) => mockAudit(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import {
  retryOutboxItemAction,
  getOutboxItemsAction,
  getScheduledPostsAction,
} from "../admin-telegram"

describe("T2.9 Telegram Publishing Center - Server Actions", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000"

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminPerm.mockResolvedValue({ id: "admin-1" })
  })

  describe("retryOutboxItemAction", () => {
    it("returns { ok: false } when status is 'SENT'", async () => {
      mockDb.outbox.findUnique.mockResolvedValueOnce({
        id: validUuid,
        status: "SENT",
      })

      const res = await retryOutboxItemAction({ outboxId: validUuid })
      expect(res.ok).toBe(false)
      expect(res.error).toContain("فقط آیتم‌های FAILED یا DEAD قابل ارسال دوباره هستند")
      expect(mockDb.outbox.update).not.toHaveBeenCalled()
    })

    it("changes status to 'PENDING' and resets attempts when status is 'DEAD'", async () => {
      mockDb.outbox.findUnique.mockResolvedValueOnce({
        id: validUuid,
        status: "DEAD",
      })

      const res = await retryOutboxItemAction({ outboxId: validUuid })
      expect(res.ok).toBe(true)
      expect(mockDb.outbox.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: expect.objectContaining({
          status: "PENDING",
          attempts: 0,
          lastError: null,
        }),
      })
      expect(mockAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "OUTBOX_RETRY",
          resource: "Outbox",
          resourceId: validUuid,
        })
      )
    })

    it("returns validation error on invalid UUID", async () => {
      const res = await retryOutboxItemAction({ outboxId: "not-a-uuid" })
      expect(res.ok).toBe(false)
      expect(mockDb.outbox.findUnique).not.toHaveBeenCalled()
    })
  })

  describe("getOutboxItemsAction", () => {
    it("filters properly when status is 'FAILED'", async () => {
      mockDb.outbox.findMany.mockResolvedValueOnce([
        {
          id: validUuid,
          event: "order.created",
          channel: "tg_admin",
          status: "FAILED",
          attempts: 3,
          runAfter: new Date(),
          lastError: "Rate limit",
          sentAt: null,
          createdAt: new Date(),
        },
      ])
      mockDb.outbox.count.mockResolvedValueOnce(1)

      const res = await getOutboxItemsAction({ status: "FAILED", page: 1 })
      expect(res.ok).toBe(true)
      expect(mockDb.outbox.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "FAILED" }),
        })
      )
      expect(res.data?.items).toHaveLength(1)
      expect(res.data?.items[0]?.status).toBe("FAILED")
    })
  })

  describe("getScheduledPostsAction", () => {
    it("queries PENDING posts with runAfter in the future and channel starting with 'tg'", async () => {
      const futureDate = new Date(Date.now() + 3600000)
      mockDb.outbox.findMany.mockResolvedValueOnce([
        {
          id: validUuid,
          event: "price.bulletin",
          channel: "tg_channel",
          runAfter: futureDate,
          createdAt: new Date(),
        },
      ])

      const res = await getScheduledPostsAction()
      expect(res.ok).toBe(true)
      expect(mockDb.outbox.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            channel: { startsWith: "tg" },
          }),
        })
      )
      expect(res.data).toHaveLength(1)
      expect(res.data?.[0]?.event).toBe("price.bulletin")
    })
  })
})
