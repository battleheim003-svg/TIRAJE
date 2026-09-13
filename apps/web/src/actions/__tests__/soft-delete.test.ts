import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb, mockRequireAdminPerm } = vi.hoisted(() => {
  return {
    mockDb: {
      product: {
        update: vi.fn(),
        count: vi.fn(),
      },
      brand: {
        update: vi.fn(),
        count: vi.fn(),
      },
      category: {
        update: vi.fn(),
        count: vi.fn(),
      },
      productCategory: {
        count: vi.fn(),
      },
      post: {
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
    mockRequireAdminPerm: vi.fn(),
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

vi.mock("@/lib/admin-guard", () => ({
  requireAdminPerm: (...args: unknown[]) => mockRequireAdminPerm(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map([["x-forwarded-for", "127.0.0.1"]])),
}))

import { adminDeleteProductAction, adminRestoreProductAction } from "../admin-products"
import { adminDeleteBrandAction, adminRestoreBrandAction } from "../admin-brands"
import { adminDeleteCategoryAction, adminRestoreCategoryAction } from "../admin-categories"
import { adminDeletePostAction, adminRestorePostAction } from "../admin-blog"

describe("T1.5 Soft Delete and Restore Actions", () => {
  const currentAdmin = { id: "admin-1", role: "super_admin", permissions: ["*"] }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminPerm.mockResolvedValue(currentAdmin)
    mockDb.auditLog.create.mockResolvedValue({ id: "audit-1" })
  })

  describe("Product soft delete & restore", () => {
    it("soft deletes product setting archivedAt and isActive: false", async () => {
      mockDb.product.update.mockResolvedValue({ id: "prod-1" })
      const result = await adminDeleteProductAction("prod-1")
      expect(result).toEqual({ ok: true })
      expect(mockDb.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          archivedAt: expect.any(Date),
          isActive: false,
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "product.archive",
            resource: "Product",
            resourceId: "prod-1",
          }),
        })
      )
    })

    it("restores product resetting archivedAt to null and isActive: true", async () => {
      mockDb.product.update.mockResolvedValue({ id: "prod-1" })
      const result = await adminRestoreProductAction("prod-1")
      expect(result).toEqual({ ok: true })
      expect(mockDb.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          archivedAt: null,
          isActive: true,
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "product.restore",
            resource: "Product",
            resourceId: "prod-1",
          }),
        })
      )
    })
  })

  describe("Brand soft delete & restore", () => {
    it("soft deletes brand when not used in products", async () => {
      mockDb.product.count.mockResolvedValue(0)
      mockDb.brand.update.mockResolvedValue({ id: "brand-1" })

      const fd = new FormData()
      fd.set("brandId", "brand-1")
      const result = await adminDeleteBrandAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.brand.update).toHaveBeenCalledWith({
        where: { id: "brand-1" },
        data: {
          archivedAt: expect.any(Date),
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "brand.delete",
            resource: "Brand",
            resourceId: "brand-1",
          }),
        })
      )
    })

    it("restores brand resetting archivedAt to null", async () => {
      mockDb.brand.update.mockResolvedValue({ id: "brand-1" })

      const fd = new FormData()
      fd.set("brandId", "brand-1")
      const result = await adminRestoreBrandAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.brand.update).toHaveBeenCalledWith({
        where: { id: "brand-1" },
        data: {
          archivedAt: null,
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "brand.restore",
            resource: "Brand",
            resourceId: "brand-1",
          }),
        })
      )
    })
  })

  describe("Category soft delete & restore", () => {
    it("soft deletes category when no children or product relations exist", async () => {
      mockDb.category.count.mockResolvedValue(0)
      mockDb.productCategory.count.mockResolvedValue(0)
      mockDb.category.update.mockResolvedValue({ id: "cat-1" })

      const fd = new FormData()
      fd.set("categoryId", "cat-1")
      const result = await adminDeleteCategoryAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: {
          archivedAt: expect.any(Date),
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "category.delete",
            resource: "Category",
            resourceId: "cat-1",
          }),
        })
      )
    })

    it("restores category resetting archivedAt to null", async () => {
      mockDb.category.update.mockResolvedValue({ id: "cat-1" })

      const fd = new FormData()
      fd.set("categoryId", "cat-1")
      const result = await adminRestoreCategoryAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: {
          archivedAt: null,
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "category.restore",
            resource: "Category",
            resourceId: "cat-1",
          }),
        })
      )
    })
  })

  describe("Post soft delete & restore", () => {
    it("soft deletes blog post setting archivedAt", async () => {
      mockDb.post.update.mockResolvedValue({ id: "post-1" })

      const fd = new FormData()
      fd.set("id", "post-1")
      const result = await adminDeletePostAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.post.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: {
          archivedAt: expect.any(Date),
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "post.delete",
            resource: "Post",
            resourceId: "post-1",
          }),
        })
      )
    })

    it("restores blog post resetting archivedAt to null", async () => {
      mockDb.post.update.mockResolvedValue({ id: "post-1" })

      const fd = new FormData()
      fd.set("id", "post-1")
      const result = await adminRestorePostAction(fd)
      expect(result).toEqual({ ok: true })
      expect(mockDb.post.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: {
          archivedAt: null,
        },
      })
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            action: "post.restore",
            resource: "Post",
            resourceId: "post-1",
          }),
        })
      )
    })
  })
})
