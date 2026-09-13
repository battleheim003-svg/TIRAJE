import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      order: {
        findMany: vi.fn(),
      },
      quoteRequest: {
        count: vi.fn(),
      },
    },
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import { getSalesStats } from "../sales-stats"

describe("T2.3 Sales Stats Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns default zeroed stats when database query throws error", async () => {
    mockDb.order.findMany.mockRejectedValue(new Error("Connection error"))
    mockDb.quoteRequest.count.mockResolvedValue(0)

    const stats = await getSalesStats()

    expect(stats).toEqual({
      daily: [],
      byBrand: [],
      byProvince: [],
      conversion: {
        quotesTotal: 0,
        quotesConverted: 0,
        rate: 0,
      },
    })
  })

  it("calculates conversion rate correctly and returns rate 0 when quotesTotal is 0", async () => {
    mockDb.order.findMany.mockResolvedValue([])
    mockDb.quoteRequest.count.mockResolvedValue(0)

    const stats = await getSalesStats()

    expect(stats.conversion.quotesTotal).toBe(0)
    expect(stats.conversion.quotesConverted).toBe(0)
    expect(stats.conversion.rate).toBe(0)
    expect(stats.daily).toHaveLength(30)
  })

  it("calculates revenue, weight and conversion rate with mock order data", async () => {
    const now = new Date()
    mockDb.order.findMany.mockResolvedValue([
      {
        id: "ord-1",
        totalAmount: 12_000_000,
        shippingProvince: "تهران",
        createdAt: now,
        items: [
          {
            quantity: 40,
            totalPrice: 12_000_000,
            weightKg: 50,
            product: {
              brandId: "brand-1",
              brand: { id: "brand-1", nameFa: "سیمان تهران" },
            },
          },
        ],
      },
    ])

    mockDb.quoteRequest.count.mockImplementation(({ where }) => {
      if (where?.status) {
        return Promise.resolve(4) // 4 converted
      }
      return Promise.resolve(10) // 10 total
    })

    const stats = await getSalesStats()

    // 30 days daily stats
    expect(stats.daily).toHaveLength(30)
    const todayStat = stats.daily[stats.daily.length - 1]
    expect(todayStat?.revenueToman).toBe(12_000_000)
    expect(todayStat?.weightTon).toBe(2) // 40 * 50kg = 2000kg = 2 ton

    // Brand stat
    expect(stats.byBrand).toHaveLength(1)
    expect(stats.byBrand[0]?.brandNameFa).toBe("سیمان تهران")
    expect(stats.byBrand[0]?.revenueToman).toBe(12_000_000)
    expect(stats.byBrand[0]?.weightTon).toBe(2)

    // Province stat
    expect(stats.byProvince).toHaveLength(1)
    expect(stats.byProvince[0]?.province).toBe("تهران")
    expect(stats.byProvince[0]?.orderCount).toBe(1)

    // Conversion rate
    expect(stats.conversion.quotesTotal).toBe(10)
    expect(stats.conversion.quotesConverted).toBe(4)
    expect(stats.conversion.rate).toBe(0.4)
  })
})
