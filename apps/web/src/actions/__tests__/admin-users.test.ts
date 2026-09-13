import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb, mockRequireAdminPerm, mockHeaders } = vi.hoisted(() => {
  return {
    mockDb: {
      user: {
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
      },
      order: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      quoteRequest: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      contact: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
    mockRequireAdminPerm: vi.fn(),
    mockHeaders: vi.fn().mockResolvedValue(new Map([["x-forwarded-for", "127.0.0.1"]])),
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
  CustomerType: {
    NORMAL: "NORMAL",
    CONTRACTOR: "CONTRACTOR",
    COMPANY: "COMPANY",
  },
  Prisma: {},
}))

vi.mock("@/lib/admin-guard", () => ({
  requireAdminPerm: (...args: unknown[]) => mockRequireAdminPerm(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}))

import {
  adminToggleUserStatusAction,
  adminDeleteUserAction,
  adminRestoreUserAction,
  changeCustomerTypeAction,
  getUserProfileAction,
  getUserOrdersAction,
  getUserQuotesAction,
  getUserContactsAction,
} from "../admin-users"
import { audit } from "@/lib/audit"

describe("Admin Users Actions & Anti-self-destruction Guards", () => {
  const currentAdmin = { id: "admin-1", role: "super_admin", permissions: ["users:update"] }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminPerm.mockResolvedValue(currentAdmin)
  })

  it("prevents admin from deactivating their own account", async () => {
    const result = await adminToggleUserStatusAction("admin-1", false)
    expect(result).toEqual({ success: false, error: "نمیتوانید حساب خود را غیرفعال کنید" })
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it("prevents admin from deleting their own account", async () => {
    const result = await adminDeleteUserAction("admin-1")
    expect(result).toEqual({ success: false, error: "نمیتوانید حساب خود را حذف کنید" })
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it("prevents deleting the last active super_admin", async () => {
    mockDb.user.count.mockResolvedValue(1) // Only 1 active super_admin left
    mockDb.user.findUnique.mockResolvedValue({
      id: "admin-2",
      role: { name: "super_admin" },
    })

    const result = await adminDeleteUserAction("admin-2")
    expect(result).toEqual({ success: false, error: "آخرین مدیر ارشد سیستم را نمیتوان حذف کرد" })
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it("allows soft-deleting super_admin if another active super_admin exists", async () => {
    mockDb.user.count.mockResolvedValue(2) // 2 active super_admins
    mockDb.user.update.mockResolvedValue({ id: "admin-2" })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-1" })

    const result = await adminDeleteUserAction("admin-2")
    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "admin-2" },
      data: {
        archivedAt: expect.any(Date),
        isActive: false,
        tokenVersion: { increment: 1 },
      },
    })
    expect(mockDb.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "admin-1",
          action: "user.archive",
          resource: "User",
          resourceId: "admin-2",
        }),
      })
    )
  })

  it("restores user by setting archivedAt null and isActive true", async () => {
    mockDb.user.update.mockResolvedValue({ id: "admin-2" })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-restore" })

    const result = await adminRestoreUserAction("admin-2")
    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "admin-2" },
      data: {
        archivedAt: null,
        isActive: true,
      },
    })
    expect(mockDb.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "admin-1",
          action: "user.restore",
          resource: "User",
          resourceId: "admin-2",
        }),
      })
    )
  })

  it("allows updating another user status, increments tokenVersion and records audit log", async () => {
    mockDb.user.update.mockResolvedValue({ id: "user-2", isActive: false })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-2" })

    const result = await adminToggleUserStatusAction("user-2", false)
    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: {
        isActive: false,
        tokenVersion: { increment: 1 },
      },
    })
    expect(mockDb.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "admin-1",
          action: "user.status_changed",
          resource: "User",
          resourceId: "user-2",
        }),
      })
    )
  })

  it("increments tokenVersion when activating or deactivating user to invalidate session", async () => {
    mockDb.user.update.mockResolvedValue({ id: "user-3", isActive: true })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-3" })

    const result = await adminToggleUserStatusAction("user-3", true)
    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "user-3" },
      data: {
        isActive: true,
        tokenVersion: { increment: 1 },
      },
    })
  })
})

describe("Customer 360 Profile Actions (T2.10)", () => {
  const currentAdmin = { id: "admin-1", role: "super_admin", permissions: ["users:update", "users:read", "orders:read"] }
  const validUserId = "123e4567-e89b-12d3-a456-426614174000"
  const selfAdminId = "11111111-1111-4111-a111-111111111111"

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminPerm.mockResolvedValue({ id: selfAdminId, role: "super_admin" })
  })

  it("prevents changing self customerType", async () => {
    const result = await changeCustomerTypeAction({
      userId: selfAdminId,
      customerType: "COMPANY",
    })
    expect(result).toEqual({
      ok: false,
      success: false,
      error: "نمیتوانید نوع مشتری خود را تغییر دهید",
    })
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it("validates invalid UUID or invalid customerType", async () => {
    const result1 = await changeCustomerTypeAction({
      userId: "invalid-uuid",
      customerType: "COMPANY",
    })
    expect(result1.ok).toBe(false)
    expect(mockDb.user.update).not.toHaveBeenCalled()

    const result2 = await changeCustomerTypeAction({
      userId: validUserId,
      customerType: "INVALID_TYPE",
    })
    expect(result2.ok).toBe(false)
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it("updates customerType and writes audit log on success", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: validUserId,
      customerType: "NORMAL",
    })
    mockDb.user.update.mockResolvedValue({
      id: validUserId,
      customerType: "CONTRACTOR",
    })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-ct" })

    const result = await changeCustomerTypeAction({
      userId: validUserId,
      customerType: "CONTRACTOR",
    })

    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: validUserId },
      data: { customerType: "CONTRACTOR" },
    })
    expect(mockDb.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: selfAdminId,
          action: "user.change_customer_type",
          resource: "User",
          resourceId: validUserId,
          oldValues: { customerType: "NORMAL" },
          newValues: { customerType: "CONTRACTOR" },
        }),
      })
    )
  })

  it("returns ok: false for nonexistent user in getUserProfileAction", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)

    const result = await getUserProfileAction(validUserId)
    expect(result).toEqual({
      ok: false,
      success: false,
      error: "کاربر یافت نشد",
    })
  })

  it("returns full profile data and stats in getUserProfileAction", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: validUserId,
      name: "تست کاربر",
      email: "test@example.com",
      phone: "09123456789",
      isActive: true,
      customerType: "COMPANY",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      customerProfile: {
        companyName: "شرکت سپهر",
        nationalId: "1010101010",
        economicCode: "4111111111",
        address: "تهران خیابان آزادی",
        postalCode: "1234567890",
      },
    })
    mockDb.order.findMany.mockResolvedValue([
      { totalAmount: 5000000 },
      { totalAmount: 3000000 },
    ])
    mockDb.quoteRequest.count.mockResolvedValue(4)
    mockDb.contact.count.mockResolvedValue(2)
    mockDb.order.count.mockResolvedValue(2)

    const result = await getUserProfileAction(validUserId)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe("تست کاربر")
      expect(result.data.customerProfile?.companyName).toBe("شرکت سپهر")
      expect(result.data._stats.totalPurchaseToman).toBe(8000000)
      expect(result.data._stats.orderCount).toBe(2)
      expect(result.data._stats.quoteCount).toBe(4)
      expect(result.data._stats.contactCount).toBe(2)
      expect(result.data.telegramUserId).toBeNull()
    }
  })

  it("getUserOrdersAction returns user orders with pagination", async () => {
    mockDb.order.findMany.mockResolvedValue([
      {
        id: "ord-1",
        orderNumber: "ORD-1001",
        status: "DELIVERED",
        totalAmount: 4500000,
        createdAt: new Date("2026-02-01T12:00:00Z"),
      },
    ])
    mockDb.order.count.mockResolvedValue(1)

    const result = await getUserOrdersAction({ userId: validUserId, page: 1 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.total).toBe(1)
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0].orderNumber).toBe("ORD-1001")
    }
  })
})

describe("audit() service error isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("never throws when database error occurs during audit log creation", async () => {
    mockDb.auditLog.create.mockRejectedValue(new Error("DB connection lost"))
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      audit({
        userId: "u1",
        action: "test.action",
        resource: "Test",
      })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith(
      "[audit] Failed to create audit log:",
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })
})
