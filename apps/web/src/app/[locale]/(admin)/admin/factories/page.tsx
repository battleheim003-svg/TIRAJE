import React from "react"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { FactoriesManager } from "./FactoriesManager"

export const metadata: Metadata = {
  title: "مدیریت کارخانجات سیمان | پنل مدیریت تیراژه",
}

export default async function AdminFactoriesPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const factories = await db.factory.findMany({
    orderBy: [{ province: "asc" }, { nameFa: "asc" }],
    include: {
      _count: {
        select: {
          products: true,
          shippingRates: true,
        },
      },
    },
  })

  const serializedFactories = factories.map((f) => ({
    ...f,
    latitude: f.latitude != null ? Number(f.latitude) : null,
    longitude: f.longitude != null ? Number(f.longitude) : null,
  }))

  return (
    <FactoriesManager
      locale={locale}
      fa={fa}
      factories={serializedFactories}
    />
  )
}
