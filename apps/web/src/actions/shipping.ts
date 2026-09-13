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
      province,
    },
    include: {
      shippingRates: {
        where: {
          isActive: true,
        },
      },
    },
  })

  if (!zone || zone.shippingRates.length === 0) {
    return {
      success: false,
      error: "در حال حاضر ارسال به این منطقه امکان‌پذیر نیست",
    }
  }

  const quotes: FreightQuote[] = zone.shippingRates.map((rate) => ({
    zoneId: zone.id,
    zoneName: zone.nameFa,
    truckType: rate.truckType,
    baseCost: Number(rate.baseCost),
    costPerTon: Number(rate.costPerTon),
    totalWeight: totalWeightTon,
    freightCost: calculateFreight(
      Number(rate.baseCost),
      Number(rate.costPerTon),
      totalWeightTon
    ),
    estimatedDaysMin: rate.estimatedDays ?? 1,
    estimatedDaysMax: (rate.estimatedDays ?? 1) + 2,
  }))

  return { success: true, data: quotes }
}

import { calculateShippingCost } from "../lib/shipping"
import { TruckType } from "@tirajeh/database"
import { z } from "zod"

const CalculateShippingSchema = z.object({
  province: z.string().min(1, "استان الزامی است").transform((s) => s.trim()),
  truckType: z.nativeEnum(TruckType, { errorMap: () => ({ message: "نوع ماشین حمل نامعتبر است" }) }),
  totalWeightTon: z.preprocess((v) => {
    const n = parseFloat(String(v))
    return isNaN(n) ? 1 : n
  }, z.number().positive().default(1)),
})

export async function calculateShippingCostAction(
  formData: FormData
): Promise<ActionResult<{ freightCost: number }>> {
  const parsed = CalculateShippingSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات استان یا ماشین ناقص است" }
  }

  const { province, truckType, totalWeightTon } = parsed.data
  const totalWeightKg = totalWeightTon * 1000

  try {
    const quote = await calculateShippingCost(province, truckType, totalWeightKg)
    return { success: true, data: { freightCost: quote.totalCostToman } }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "SHIPPING_NOT_FOUND"
    ) {
      return { success: false, error: "در حال حاضر ارسال به این منطقه با این ناوگان امکان‌پذیر نیست" }
    }
    return { success: false, error: "خطا در محاسبه هزینه حمل" }
  }
}
