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

import { adminToggleUserStatusAction, adminDeleteUserAction } from "../admin-users"
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
    expect(mockDb.user.delete).not.toHaveBeenCalled()
  })

  it("prevents deleting the last active super_admin", async () => {
    mockDb.user.count.mockResolvedValue(1) // Only 1 active super_admin left
    mockDb.user.findUnique.mockResolvedValue({
      id: "admin-2",
      role: { name: "super_admin" },
    })

    const result = await adminDeleteUserAction("admin-2")
    expect(result).toEqual({ success: false, error: "آخرین مدیر ارشد سیستم را نمیتوان حذف کرد" })
    expect(mockDb.user.delete).not.toHaveBeenCalled()
  })

  it("allows deleting super_admin if another active super_admin exists", async () => {
    mockDb.user.count.mockResolvedValue(2) // 2 active super_admins
    mockDb.user.delete.mockResolvedValue({ id: "admin-2" })
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-1" })

    const result = await adminDeleteUserAction("admin-2")
    expect(result).toEqual({ ok: true, success: true })
    expect(mockDb.user.delete).toHaveBeenCalledWith({ where: { id: "admin-2" } })
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
