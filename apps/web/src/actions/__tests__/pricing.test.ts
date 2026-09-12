import { describe, it, expect, vi } from "vitest"
import { resolveUnitPriceToman, AppError, ProductWithOptions } from "../../lib/pricing"
import { PackagingTier } from "@tirajeh/database"

// Mock database to avoid connection error when importing cart.ts
vi.mock("@tirajeh/database", () => ({
  db: {},
  PackagingTier: {
    SINGLE: "SINGLE",
    PAIR: "PAIR",
    TRUCK_6W: "TRUCK_6W",
    TRUCK_10W: "TRUCK_10W",
  }
}))
vi.mock("@tirajeh/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))

import { addToCartAction } from "../cart"

describe("resolveUnitPriceToman", () => {
  it("returns base price when tier is null", () => {
    const product = { price: 10000 } as ProductWithOptions
    expect(resolveUnitPriceToman(product, null)).toBe(10000)
  })

  it("returns price-per-bag when active option exists", () => {
    const product = {
      price: 10000,
      packagingOptions: [{ tier: PackagingTier.SINGLE, price: 50000, bagCount: 5, isActive: true }]
    } as ProductWithOptions
    expect(resolveUnitPriceToman(product, PackagingTier.SINGLE)).toBe(10000)
  })

  it("throws AppError when tier has no active option", () => {
    const product = {
      price: 10000,
      packagingOptions: [{ tier: PackagingTier.SINGLE, price: 50000, bagCount: 5, isActive: false }]
    } as ProductWithOptions
    expect(() => resolveUnitPriceToman(product, PackagingTier.SINGLE))
      .toThrow(AppError)
  })
})

describe("addToCartAction validation", () => {
  it("rejects undefined input", async () => {
    const res = await addToCartAction(undefined)
    expect(res).toEqual({ success: false, error: "ورودی نامعتبر" })
  })

  it("rejects quantity: 'abc'", async () => {
    const res = await addToCartAction({ productId: "123e4567-e89b-12d3-a456-426614174000", quantity: "abc" })
    expect(res).toEqual({ success: false, error: "ورودی نامعتبر" })
  })

  it("rejects quantity: 2.5", async () => {
    const res = await addToCartAction({ productId: "123e4567-e89b-12d3-a456-426614174000", quantity: 2.5 })
    expect(res).toEqual({ success: false, error: "ورودی نامعتبر" })
  })

  it("rejects quantity: -1", async () => {
    const res = await addToCartAction({ productId: "123e4567-e89b-12d3-a456-426614174000", quantity: -1 })
    expect(res).toEqual({ success: false, error: "ورودی نامعتبر" })
  })
})
