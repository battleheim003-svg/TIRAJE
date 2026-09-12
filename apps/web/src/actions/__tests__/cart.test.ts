import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockAuth, mockCookieStore, mockDb } = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
    mockCookieStore: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
    mockDb: {
      cartItem: {
        aggregate: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
    }
  }
})

vi.mock("@tirajeh/auth", () => ({
  auth: () => mockAuth(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import {
  getCartCountAction,
  getCartAction,
  mergeCartAction,
} from "../cart"

describe("Cart Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getCartCountAction", () => {
    it("returns aggregated quantity for authenticated user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } })
      mockDb.cartItem.aggregate.mockResolvedValue({ _sum: { quantity: 8 } })

      const count = await getCartCountAction()
      expect(count).toBe(8)
      expect(mockDb.cartItem.aggregate).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        _sum: { quantity: true },
      })
    })

    it("returns 0 when no session", async () => {
      mockAuth.mockResolvedValue(null)
      mockCookieStore.get.mockReturnValue(undefined)

      const count = await getCartCountAction()
      expect(count).toBe(0)
    })
  })

  describe("getCartAction", () => {
    it("calculates totals correctly for user with 2 items", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } })
      mockDb.cartItem.findMany.mockResolvedValue([
        {
          id: "item-1",
          quantity: 2,
          product: {
            id: "prod-1",
            nameFa: "Product 1",
            nameEn: "Product 1 En",
            slug: "product-1",
            price: 100000,
            comparePrice: null,
            stockQty: 50,
            minOrderQty: 1,
            images: [{ url: "/img/p1.jpg" }],
          },
        },
        {
          id: "item-2",
          quantity: 3,
          product: {
            id: "prod-2",
            nameFa: "Product 2",
            nameEn: null,
            slug: "product-2",
            price: 50000,
            comparePrice: null,
            stockQty: 20,
            minOrderQty: 1,
            images: [],
          },
        }
      ])

      const res = await getCartAction()
      expect(res.totalCount).toBe(5)
      // 2 * 100000 + 3 * 50000 = 200000 + 150000 = 350000
      expect(res.subtotalToman).toBe(350000)
      expect(res.items).toHaveLength(2)
    })
  })

  describe("mergeCartAction", () => {
    it("caps item quantity to stockQty when merging guest cart into user cart", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-123" } })
      mockCookieStore.get.mockReturnValue({ value: "guest-sid" })

      // Guest cart items
      mockDb.cartItem.findMany.mockResolvedValue([
        {
          productId: "prod-1",
          quantity: 20,
          product: { stockQty: 25 },
        },
      ])

      // Existing user cart item
      mockDb.cartItem.findUnique.mockResolvedValue({
        id: "existing-item-id",
        quantity: 10,
      })

      await mergeCartAction()

      // 10 existing + 20 guest = 30, but stock is 25 => capped at 25
      expect(mockDb.cartItem.update).toHaveBeenCalledWith({
        where: { id: "existing-item-id" },
        data: { quantity: 25 },
      })
      expect(mockDb.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: "guest-sid" },
      })
      expect(mockCookieStore.delete).toHaveBeenCalledWith("session_id")
    })
  })
})
