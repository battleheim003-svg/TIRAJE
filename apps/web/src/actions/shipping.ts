"use server"

import { db } from "@tirajeh/database"
import { FreightQuerySchema } from "@tirajeh/shared"
import { calculateFreight } from "@tirajeh/shared"
import type { ActionResult, FreightQuote } from "@tirajeh/shared"

export async function getFreightQuotesAction(
  formData: FormData
): Promise<ActionResult<FreightQuote[]>> {
  const parsed = FreightQuerySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات ارسال نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { province, totalWeightTon } = parsed.data

  // Find matching zone
  const zone = await db.shippingZone.findFirst({
    where: {
      isActive: true,
      provinces: { has: province },
    },
    include: {
      rates: {
        where: {
          isActive: true,
          minLoadTon: { lte: totalWeightTon },
          capacityTon: { gte: totalWeightTon },
        },
        orderBy: { capacityTon: "asc" },
      },
    },
  })

  if (!zone || zone.rates.length === 0) {
    return {
      success: false,
      error: "در حال حاضر ارسال به این منطقه امکان‌پذیر نیست",
    }
  }

  const quotes: FreightQuote[] = zone.rates.map((rate: any) => ({
    zoneId: zone.id,
    zoneName: zone.name,
    truckType: rate.truckType,
    baseCost: Number(rate.baseCost),
    costPerTon: Number(rate.costPerTon),
    totalWeight: totalWeightTon,
    freightCost: calculateFreight(
      Number(rate.baseCost),
      Number(rate.costPerTon),
      totalWeightTon
    ),
    estimatedDaysMin: rate.estimatedDaysMin,
    estimatedDaysMax: rate.estimatedDaysMax,
  }))

  return { success: true, data: quotes }
}
