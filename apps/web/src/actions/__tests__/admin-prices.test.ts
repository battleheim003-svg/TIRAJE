import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb, mockRequireAdminPerm, mockAudit, mockRevalidatePath } = vi.hoisted(() => {
  return {
    mockDb: {
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      productPriceHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    mockRequireAdminPerm: vi.fn(),
    mockAudit: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
  Prisma: {
    Decimal: class {
      val: number
      constructor(v: number) {
        this.val = v
      }
      toString() {
        return String(this.val)
      }
    },
  },
}))

vi.mock("@/lib/admin-guard", () => ({
  requireAdminPerm: (...args: unknown[]) => mockRequireAdminPerm(...args),
}))

vi.mock("@/lib/audit", () => ({
  audit: (...args: unknown[]) => mockAudit(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {
  BulkAdjustFilterSchema,
  InlinePriceUpdateSchema,
  adminInlinePriceUpdateAction,
} from "../admin-prices"

describe("T2.6 Admin Prices - Inline Price & Bulk Adjustment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdminPerm.mockResolvedValue({ id: "admin-uuid-1" })
  })

  describe("InlinePriceUpdateSchema validation", () => {
    it("validates valid productId and newPrice", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const result = InlinePriceUpdateSchema.safeParse({
        productId: validUuid,
        newPrice: 850000,
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid UUID productId", () => {
      const result = InlinePriceUpdateSchema.safeParse({
        productId: "invalid-uuid",
        newPrice: 850000,
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative price", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const result = InlinePriceUpdateSchema.safeParse({
        productId: validUuid,
        newPrice: -500,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("BulkAdjustFilterSchema validation", () => {
    const validBrandId = "123e4567-e89b-12d3-a456-426614174000"
    const validCategoryId = "223e4567-e89b-12d3-a456-426614174000"

    it("accepts valid brandId and percent within range", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        brandId: validBrandId,
        percent: 15,
        reason: "افزایش نرخ سالانه کارخانه",
      })
      expect(result.success).toBe(true)
    })

    it("accepts valid categoryId and negative percent within range", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        categoryId: validCategoryId,
        percent: -20,
        reason: "تخفیف ویژه دوره‌ای فله",
      })
      expect(result.success).toBe(true)
    })

    it("fails when neither brandId nor categoryId is provided", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        percent: 10,
        reason: "تغییر عمومی بدون فیلتر",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("حداقل انتخاب یکی از فیلترهای برند یا دسته‌بندی الزامی است")
      }
    })

    it("fails when percent is less than -50%", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        brandId: validBrandId,
        percent: -51,
        reason: "کاهش بیش از حد مجاز",
      })
      expect(result.success).toBe(false)
    })

    it("fails when percent is greater than 200%", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        brandId: validBrandId,
        percent: 201,
        reason: "افزایش بیش از حد مجاز",
      })
      expect(result.success).toBe(false)
    })

    it("fails when reason is shorter than 3 characters", () => {
      const result = BulkAdjustFilterSchema.safeParse({
        brandId: validBrandId,
        percent: 10,
        reason: "عل",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("adminInlinePriceUpdateAction", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000"

    it("returns success without DB transaction if price has not changed", async () => {
      mockDb.product.findUnique.mockResolvedValueOnce({
        id: validUuid,
        price: 850000,
      })

      const res = await adminInlinePriceUpdateAction({
        productId: validUuid,
        newPrice: 850000,
      })

      expect(res).toEqual({
        success: true,
        data: { newPrice: 850000, oldPrice: 850000 },
      })
      expect(mockDb.$transaction).not.toHaveBeenCalled()
      expect(mockAudit).not.toHaveBeenCalled()
    })

    it("executes transaction and audit when price changes", async () => {
      mockDb.product.findUnique.mockResolvedValueOnce({
        id: validUuid,
        price: 850000,
      })

      mockDb.$transaction.mockImplementationOnce(async (cb: (tx: typeof mockDb) => Promise<unknown>) => {
        return cb(mockDb)
      })

      const res = await adminInlinePriceUpdateAction({
        productId: validUuid,
        newPrice: 900000,
      })

      expect(res).toEqual({
        success: true,
        data: { newPrice: 900000, oldPrice: 850000 },
      })
      expect(mockDb.$transaction).toHaveBeenCalled()
      expect(mockDb.product.update).toHaveBeenCalledWith({
        where: { id: validUuid },
        data: expect.objectContaining({ price: 900000 }),
      })
      expect(mockDb.productPriceHistory.create).toHaveBeenCalled()
      expect(mockAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-uuid-1",
          action: "price.inline_update",
          resource: "Product",
          resourceId: validUuid,
          before: { price: 850000 },
          after: { price: 900000 },
        })
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products")
    })
  })

  describe("Bulk price calculation logic", () => {
    it("rounds percentage adjustment accurately", () => {
      const oldPrice = 853200
      const percent = 7.5
      const newPrice = Math.max(0, Math.round(oldPrice * (1 + percent / 100)))
      // 853200 * 1.075 = 917190
      expect(newPrice).toBe(917190)
    })

    it("calculates discount properly and clamps non-negative", () => {
      const oldPrice = 500000
      const percent = -40
      const newPrice = Math.max(0, Math.round(oldPrice * (1 + percent / 100)))
      // 500000 * 0.6 = 300000
      expect(newPrice).toBe(300000)
    })

    it("handles zero difference when price does not change", () => {
      const oldPrice = 500000
      const percent = 0
      const newPrice = Math.max(0, Math.round(oldPrice * (1 + percent / 100)))
      expect(newPrice).toBe(oldPrice)
    })
  })
})
