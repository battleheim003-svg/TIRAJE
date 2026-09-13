import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      order: {
        count: vi.fn(),
      },
      contact: {
        count: vi.fn(),
      },
      quoteRequest: {
        count: vi.fn(),
      },
      outbox: {
        findMany: vi.fn(),
      },
      orderEvent: {
        findMany: vi.fn(),
      },
    },
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import { getAdminCounts } from "../../lib/admin-counts"
import { getRecentActivity } from "../../lib/admin-activity"
import { OUTBOX_EVENTS } from "@tirajeh/shared"

describe("T2.1 Admin Counts and Recent Activity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAdminCounts", () => {
    it("returns zero counts when database query throws error (fallback safe)", async () => {
      mockDb.order.count.mockRejectedValue(new Error("DB Connection Failed"))
      mockDb.contact.count.mockResolvedValue(5)
      mockDb.quoteRequest.count.mockResolvedValue(2)

      const counts = await getAdminCounts()

      expect(counts).toEqual({
        pendingOrders: 0,
        openTickets: 0,
        unansweredQuotes: 0,
      })
    })

    it("returns correct count values from database queries", async () => {
      mockDb.order.count.mockResolvedValue(12)
      mockDb.contact.count.mockResolvedValue(4)
      mockDb.quoteRequest.count.mockResolvedValue(7)

      const counts = await getAdminCounts()

      expect(counts).toEqual({
        pendingOrders: 12,
        openTickets: 4,
        unansweredQuotes: 7,
      })
      expect(mockDb.order.count).toHaveBeenCalledWith({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
      })
      expect(mockDb.contact.count).toHaveBeenCalledWith({
        where: { replyText: null },
      })
      expect(mockDb.quoteRequest.count).toHaveBeenCalledWith({
        where: { status: "PENDING" },
      })
    })
  })

  describe("getRecentActivity", () => {
    it("returns empty array when database query throws error", async () => {
      mockDb.outbox.findMany.mockRejectedValue(new Error("DB query failed"))
      mockDb.orderEvent.findMany.mockResolvedValue([])

      const activity = await getRecentActivity()
      expect(activity).toEqual([])
    })

    it("merges, formats and sorts outbox items and order events up to 10 items", async () => {
      const now = new Date("2026-09-13T12:00:00Z")
      const earlier = new Date("2026-09-13T11:00:00Z")
      const earliest = new Date("2026-09-13T10:00:00Z")

      mockDb.outbox.findMany.mockResolvedValue([
        {
          id: "out-1",
          event: OUTBOX_EVENTS.ORDER_CREATED,
          payload: { orderId: "ord-12345678", orderNumber: 1042 },
          createdAt: now,
        },
        {
          id: "out-2",
          event: OUTBOX_EVENTS.QUOTE_CREATED,
          payload: { quoteId: "quote-999" },
          createdAt: earliest,
        },
      ])

      mockDb.orderEvent.findMany.mockResolvedValue([
        {
          id: "evt-1",
          status: "CONFIRMED",
          note: "Order confirmed by admin",
          createdAt: earlier,
          orderId: "ord-abcdef123456",
        },
      ])

      const activity = await getRecentActivity()

      expect(activity).toHaveLength(3)
      // Most recent first
      expect(activity[0]?.id).toBe("outbox-out-1")
      expect(activity[0]?.label).toContain("1042")
      expect(activity[0]?.kind).toBe("order")
      expect(activity[0]?.href).toBe("/admin/orders/ord-12345678")

      // Second most recent
      expect(activity[1]?.id).toBe("event-evt-1")
      expect(activity[1]?.label).toContain("CONFIRMED")
      expect(activity[1]?.kind).toBe("order")
      expect(activity[1]?.href).toBe("/admin/orders/ord-abcdef123456")

      // Third
      expect(activity[2]?.id).toBe("outbox-out-2")
      expect(activity[2]?.kind).toBe("quote")
      expect(activity[2]?.href).toBe("/admin/quotes/quote-999")
    })
  })
})
