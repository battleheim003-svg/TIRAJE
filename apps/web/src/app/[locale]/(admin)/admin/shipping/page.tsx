import React from "react"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ShippingManager } from "./ShippingManager"

export const metadata: Metadata = {
  title: "مدیریت مناطق و نرخ‌های حمل | پنل مدیریت تیراژه",
}

export default async function AdminShippingPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const [zones, factories] = await Promise.all([
    db.shippingZone.findMany({
      orderBy: [{ province: "asc" }, { nameFa: "asc" }],
      include: {
        shippingRates: {
          include: {
            factory: {
              select: { id: true, nameFa: true },
            },
          },
          orderBy: { truckType: "asc" },
        },
        _count: {
          select: { orders: true },
        },
      },
    }),
    db.factory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameFa: true,
        province: true,
        city: true,
      },
      orderBy: { nameFa: "asc" },
    }),
  ])

  // Map Decimals to numbers for client serialization
  const serializedZones = zones.map((z) => ({
    ...z,
    shippingRates: z.shippingRates.map((r) => ({
      ...r,
      baseCost: Number(r.baseCost),
      costPerTon: Number(r.costPerTon),
    })),
  }))

  return (
    <ShippingManager
      locale={locale}
      fa={fa}
      initialZones={serializedZones}
      factories={factories}
    />
  )
}
