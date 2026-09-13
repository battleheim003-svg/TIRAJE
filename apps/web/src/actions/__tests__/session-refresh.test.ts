import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      user: {
        findUnique: vi.fn(),
      },
    },
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import { handleJwtCallback } from "@tirajeh/auth/jwt-refresh"

describe("NextAuth JWT Callback & Session Refresh (Task T1.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes token on initial sign-in with user object", async () => {
    const user = {
      id: "u1",
      email: "admin@tirajeh.com",
      name: "Admin",
      customerType: "SPECIAL",
      roleId: "r1",
      roleName: "super_admin",
      permissions: ["products:read", "products:create"],
      tokenVersion: 2,
    }

    const token: Record<string, unknown> = {}
    const result = await handleJwtCallback({ token, user })

    expect(result).not.toBeNull()
    expect(result?.id).toBe("u1")
    expect(result?.email).toBe("admin@tirajeh.com")
    expect(result?.tokenVersion).toBe(2)
    expect(result?.roleName).toBe("super_admin")
    expect(result?.permissions).toEqual(["products:read", "products:create"])
    expect(result?.refreshedAt).toBeGreaterThan(0)
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it("returns token unchanged if last refreshed less than 5 minutes ago", async () => {
    const token = {
      id: "u1",
      tokenVersion: 0,
      refreshedAt: Date.now() - 2 * 60 * 1000, // 2 minutes ago
      roleName: "staff",
      permissions: ["orders:read"],
    }

    const result = await handleJwtCallback({ token })
    expect(result).toBe(token)
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it("refreshes user from DB when refreshedAt is older than 5 minutes", async () => {
    const token = {
      id: "u1",
      tokenVersion: 1,
      refreshedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      roleName: "staff",
      permissions: ["orders:read"],
    }

    mockDb.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      tokenVersion: 1,
      roleId: "r2",
      role: {
        name: "manager",
        rolePermissions: [
          { permission: { resource: "orders", action: "manage" } },
          { permission: { resource: "products", action: "manage" } },
        ],
      },
    })

    const result = await handleJwtCallback({ token })
    expect(result).not.toBeNull()
    expect(result?.roleId).toBe("r2")
    expect(result?.roleName).toBe("manager")
    expect(result?.permissions).toEqual(["orders:manage", "products:manage"])
    expect(result?.tokenVersion).toBe(1)
    expect(result?.refreshedAt).toBeGreaterThan(Date.now() - 1000)
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: expect.any(Object),
    })
  })

  it("invalidates session (returns null) if user is not found in DB", async () => {
    const token = {
      id: "u1",
      tokenVersion: 0,
      refreshedAt: Date.now() - 10 * 60 * 1000,
    }

    mockDb.user.findUnique.mockResolvedValue(null)

    const result = await handleJwtCallback({ token })
    expect(result).toBeNull()
  })

  it("invalidates session (returns null) if user has isActive === false", async () => {
    const token = {
      id: "u1",
      tokenVersion: 0,
      refreshedAt: Date.now() - 10 * 60 * 1000,
    }

    mockDb.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: false,
      tokenVersion: 0,
      roleId: "r1",
      role: null,
    })

    const result = await handleJwtCallback({ token })
    expect(result).toBeNull()
  })

  it("invalidates session (returns null) if DB tokenVersion does not match token.tokenVersion", async () => {
    const token = {
      id: "u1",
      tokenVersion: 0, // Old token version
      refreshedAt: Date.now() - 10 * 60 * 1000,
    }

    mockDb.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      tokenVersion: 1, // DB version was incremented (e.g. status toggled or password reset)
      roleId: "r1",
      role: { name: "admin", rolePermissions: [] },
    })

    const result = await handleJwtCallback({ token })
    expect(result).toBeNull()
  })

  it("triggers immediate refresh if refreshedAt is missing on token", async () => {
    const token = {
      id: "u1",
      tokenVersion: 0,
    }

    mockDb.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      tokenVersion: 0,
      roleId: "r1",
      role: { name: "admin", rolePermissions: [] },
    })

    const result = await handleJwtCallback({ token })
    expect(result).not.toBeNull()
    expect(mockDb.user.findUnique).toHaveBeenCalled()
    expect(result?.refreshedAt).toBeGreaterThan(0)
  })

  it("returns null if token has no id", async () => {
    const token = {}
    const result = await handleJwtCallback({ token })
    expect(result).toBeNull()
  })
})
