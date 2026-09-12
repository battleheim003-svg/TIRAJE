import { describe, it, expect, vi, beforeEach } from "vitest"

const mockDb = vi.hoisted(() => {
  return {
    shippingZone: {
      findFirst: vi.fn(),
    },
  }
})

vi.mock("@tirajeh/database", () => ({
  db: mockDb,
}))

import { calculateShippingCost } from "../../lib/shipping"
import { AppError } from "@tirajeh/shared"

describe("calculateShippingCost", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns correct quote when zone and rate exist", async () => {
    mockDb.shippingZone.findFirst.mockResolvedValue({
      id: "zone-1",
      province: "تهران",
      shippingRates: [
        {
          truckType: "TRAILER_22T",
          baseCost: 2000000,
          costPerTon: 220000,
        },
      ],
    })

    const quote = await calculateShippingCost("تهران", "TRAILER_22T" as any, 25000)
    
    expect(quote.truckType).toBe("TRAILER_22T")
    expect(quote.province).toBe("تهران")
    expect(quote.baseCostToman).toBe(2000000)
    expect(quote.perTonCostToman).toBe(220000)
    expect(quote.totalCostToman).toBe(2000000 + 25 * 220000)
  })

  it("throws AppError SHIPPING_NOT_FOUND when province has no zone", async () => {
    mockDb.shippingZone.findFirst.mockResolvedValue(null)
    
    await expect(calculateShippingCost("Unknown", "TRAILER_22T" as any, 10000))
      .rejects.toThrow(AppError)
  })

  it("throws AppError SHIPPING_NOT_FOUND when zone has no rate for truckType", async () => {
    mockDb.shippingZone.findFirst.mockResolvedValue({
      id: "zone-1",
      province: "تهران",
      shippingRates: [],
    })
    
    await expect(calculateShippingCost("تهران", "TRAILER_22T" as any, 10000))
      .rejects.toThrow(AppError)
  })

  it("calculates totalCostToman = baseCost + (totalWeightKg/1000) * perTonToman", async () => {
    mockDb.shippingZone.findFirst.mockResolvedValue({
      id: "zone-1",
      province: "اصفهان",
      shippingRates: [
        {
          truckType: "TRUCK_10T",
          baseCost: 5000000,
          costPerTon: 300000,
        },
      ],
    })

    // weight is 12300 Kg => 12.3 Tons
    const quote = await calculateShippingCost("اصفهان", "TRUCK_10T" as any, 12300)
    
    expect(quote.totalCostToman).toBe(5000000 + 12.3 * 300000)
  })
})
