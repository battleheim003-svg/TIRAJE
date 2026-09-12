import { db } from "@tirajeh/database"
import type { TruckType } from "@tirajeh/database"
import { AppError } from "@tirajeh/shared"

export interface ShippingQuote {
  truckType: TruckType
  province: string
  baseCostToman: number
  perTonCostToman: number
  totalCostToman: number
}

/**
 * کرایه حمل را از جداول ShippingZone و ShippingRate میخواند
 * اگر نرخ پیدا نشد AppError("نرخ حمل یافت نشد", "SHIPPING_NOT_FOUND", 404)
 */
export async function calculateShippingCost(
  province: string,
  truckType: TruckType,
  totalWeightKg: number
): Promise<ShippingQuote> {
  const zone = await db.shippingZone.findFirst({
    where: { province },
    include: {
      shippingRates: {
        where: { truckType, isActive: true },
      },
    },
  })

  if (!zone) {
    throw new AppError("منطقه حمل پیدا نشد", "SHIPPING_NOT_FOUND", 404)
  }

  if (zone.shippingRates.length === 0) {
    throw new AppError("نرخ حمل برای این نوع ماشین یافت نشد", "SHIPPING_NOT_FOUND", 404)
  }

  const rate = zone.shippingRates[0]
  const baseCostToman = Number(rate.baseCost)
  const perTonCostToman = Number(rate.costPerTon)

  const totalCostToman = baseCostToman + (totalWeightKg / 1000) * perTonCostToman

  return {
    truckType,
    province,
    baseCostToman,
    perTonCostToman,
    totalCostToman,
  }
}
