import { describe, it, expect, vi, beforeEach } from "vitest"
import { canTransition, ORDER_TRANSITIONS } from "@tirajeh/shared"
import type { OrderStatus } from "@tirajeh/database"

const { mockDb, mockRequireAdminPerm, mockReleaseOrderStock, mockSendOrderStatusUpdate, mockAudit } = vi.hoisted(() => {
  return {
    mockDb: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      orderEvent: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        return callback(mockDb)
      }),
    },
    mockRequireAdminPerm: vi.fn(),
    mockReleaseOrderStock: vi.fn(),
    mockSendOrderStatusUpdate: vi.fn(),
    mockAudit: vi.fn(),
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
  OrderStatus: {
    PENDING: "PENDING",
    AWAITING_PAYMENT: "AWAITING_PAYMENT",
    CONFIRMED: "CONFIRMED",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
  },
}))

vi.mock("@/lib/admin-guard", () => ({
  requireAdminPerm: (...args: unknown[]) => mockRequireAdminPerm(...args),
}))

vi.mock("@/lib/audit", () => ({
  audit: (...args: unknown[]) => mockAudit(...args),
}))

vi.mock("@tirajeh/integrations", () => ({
  emailService: {
    sendOrderStatusUpdate: (...args: unknown[]) => mockSendOrderStatusUpdate(...args),
  },
  enqueue: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/stock", () => ({
  releaseOrderStock: (...args: unknown[]) => mockReleaseOrderStock(...args),
}))

import { adminUpdateOrderStatusAction, adminMoveOrderAction } from "../admin-orders"

describe("Order Status State Machine (Task T1.4)", () => {
  describe("canTransition rules", () => {
    it("canTransition('PENDING', 'CONFIRMED') → true", () => {
      expect(canTransition("PENDING", "CONFIRMED")).toBe(true)
    })

    it("canTransition('PENDING', 'AWAITING_PAYMENT') → true", () => {
      expect(canTransition("PENDING", "AWAITING_PAYMENT")).toBe(true)
    })

    it("canTransition('PENDING', 'CANCELLED') → true", () => {
      expect(canTransition("PENDING", "CANCELLED")).toBe(true)
    })

    it("canTransition('SHIPPED', 'CANCELLED') → false", () => {
      expect(canTransition("SHIPPED", "CANCELLED")).toBe(false)
    })

    it("canTransition('DELIVERED', 'CONFIRMED') → false", () => {
      expect(canTransition("DELIVERED", "CONFIRMED")).toBe(false)
    })

    it("canTransition('CANCELLED', 'CONFIRMED') → false", () => {
      expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false)
    })

    it("terminal states have empty transitions", () => {
      expect(ORDER_TRANSITIONS.CANCELLED).toEqual([])
      expect(ORDER_TRANSITIONS.REFUNDED).toEqual([])
      expect(canTransition("CANCELLED", "PENDING")).toBe(false)
      expect(canTransition("REFUNDED", "CONFIRMED")).toBe(false)
    })

    it("shipped can only transition to delivered", () => {
      expect(ORDER_TRANSITIONS.SHIPPED).toEqual(["DELIVERED"])
      expect(canTransition("SHIPPED", "DELIVERED")).toBe(true)
    })

    it("delivered can only transition to refunded", () => {
      expect(ORDER_TRANSITIONS.DELIVERED).toEqual(["REFUNDED"])
      expect(canTransition("DELIVERED", "REFUNDED")).toBe(true)
    })
  })

  describe("adminUpdateOrderStatusAction", () => {
    const adminUser = { id: "admin-1", role: "admin", permissions: ["orders:update"] }

    beforeEach(() => {
      vi.clearAllMocks()
      mockRequireAdminPerm.mockResolvedValue(adminUser)
    })

    it("returns error on invalid status string", async () => {
      const fd = new FormData()
      fd.set("orderId", "order-1")
      fd.set("status", "INVALID_STATUS")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({ success: false, error: "وضعیت نامعتبر" })
      expect(mockDb.order.findUnique).not.toHaveBeenCalled()
    })

    it("returns error if order does not exist", async () => {
      mockDb.order.findUnique.mockResolvedValue(null)

      const fd = new FormData()
      fd.set("orderId", "order-non-existent")
      fd.set("status", "CONFIRMED")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({ success: false, error: "سفارش یافت نشد" })
    })

    it("returns error when attempting illegal transition (SHIPPED -> CANCELLED)", async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "SHIPPED",
        user: { email: "user@test.com", name: "Customer" },
      })

      const fd = new FormData()
      fd.set("orderId", "order-1")
      fd.set("status", "CANCELLED")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({
        success: false,
        error: "گذار از SHIPPED به CANCELLED مجاز نیست",
      })
      expect(mockDb.order.update).not.toHaveBeenCalled()
      expect(mockReleaseOrderStock).not.toHaveBeenCalled()
    })

    it("allows valid transition (CONFIRMED -> PROCESSING)", async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "CONFIRMED",
        orderNumber: 1001,
        user: { email: "user@test.com", name: "Customer" },
      })

      const fd = new FormData()
      fd.set("orderId", "order-1")
      fd.set("status", "PROCESSING")
      fd.set("note", "شروع آماده‌سازی")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({ ok: true, success: true })
      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "PROCESSING", adminNote: "شروع آماده‌سازی" },
      })
      expect(mockDb.orderEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: "order-1",
          status: "PROCESSING",
          note: "شروع آماده‌سازی",
          createdBy: "admin-1",
        }),
      })
      expect(mockReleaseOrderStock).not.toHaveBeenCalled()
      expect(mockAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "order.status_changed",
          resource: "Order",
          resourceId: "order-1",
          before: { status: "CONFIRMED" },
          after: { status: "PROCESSING" },
        })
      )
      expect(mockSendOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: "user@test.com",
          newStatus: "PROCESSING",
        })
      )
    })

    it("releases stock when transitioning to CANCELLED", async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: "order-2",
        status: "CONFIRMED",
        orderNumber: 1002,
        user: { email: "user@test.com", name: "Customer" },
      })

      const fd = new FormData()
      fd.set("orderId", "order-2")
      fd.set("status", "CANCELLED")
      fd.set("note", "درخواست مشتری")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({ ok: true, success: true })
      expect(mockReleaseOrderStock).toHaveBeenCalledWith(expect.anything(), "order-2")
    })

    it("releases stock when transitioning to REFUNDED", async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: "order-3",
        status: "DELIVERED",
        orderNumber: 1003,
        user: { email: "user@test.com", name: "Customer" },
      })

      const fd = new FormData()
      fd.set("orderId", "order-3")
      fd.set("status", "REFUNDED")

      const result = await adminUpdateOrderStatusAction(fd)
      expect(result).toEqual({ ok: true, success: true })
      expect(mockReleaseOrderStock).toHaveBeenCalledWith(expect.anything(), "order-3")
    })
  })

  describe("T2.7 Kanban - adminMoveOrderAction", () => {
    const validOrderId = "123e4567-e89b-12d3-a456-426614174000"

    beforeEach(() => {
      vi.clearAllMocks()
      mockRequireAdminPerm.mockResolvedValue({ id: "admin-1", role: "admin", permissions: ["orders:update"] })
    })

    it("rejects invalid UUID orderId", async () => {
      const result = await adminMoveOrderAction({
        orderId: "invalid-uuid",
        newStatus: "CONFIRMED",
      })
      expect(result).toEqual({ ok: false, success: false, error: expect.any(String) })
    })

    it("returns error when order not found", async () => {
      mockDb.order.findUnique.mockResolvedValueOnce(null)
      const result = await adminMoveOrderAction({
        orderId: validOrderId,
        newStatus: "CONFIRMED",
      })
      expect(result).toEqual({ ok: false, success: false, error: "سفارش یافت نشد" })
    })

    it("returns error on invalid transition (e.g. DELIVERED → PROCESSING)", async () => {
      mockDb.order.findUnique.mockResolvedValueOnce({
        id: validOrderId,
        status: "DELIVERED",
        orderNumber: 2001,
      })
      const result = await adminMoveOrderAction({
        orderId: validOrderId,
        newStatus: "PROCESSING",
      })
      expect(result.ok).toBe(false)
      expect(result.error).toContain("گذار از DELIVERED به PROCESSING مجاز نیست")
      expect(mockDb.order.update).not.toHaveBeenCalled()
    })

    it("updates status, creates OrderEvent, releases stock if CANCELLED, and logs audit on valid transition", async () => {
      mockDb.order.findUnique.mockResolvedValueOnce({
        id: validOrderId,
        status: "CONFIRMED",
        orderNumber: 2002,
      })

      const result = await adminMoveOrderAction({
        orderId: validOrderId,
        newStatus: "PROCESSING",
      })

      expect(result).toEqual({ ok: true, success: true })
      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: validOrderId },
        data: { status: "PROCESSING" },
      })
      expect(mockDb.orderEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: validOrderId,
          status: "PROCESSING",
          createdBy: "admin-1",
        }),
      })
      expect(mockAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "ORDER_MOVE",
          resource: "Order",
          resourceId: validOrderId,
          before: { status: "CONFIRMED" },
          after: { status: "PROCESSING" },
        })
      )
    })
  })
})
