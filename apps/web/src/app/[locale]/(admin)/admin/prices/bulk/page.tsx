import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { db } from "@tirajeh/database"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { BulkPriceClient } from "./BulkPriceClient"

export const metadata: Metadata = {
  title: "تنظیم گروهی قیمت | پنل مدیریت تیراژه",
}

export default async function AdminBulkPricePage() {
  await requireAdminPerm(PERMISSIONS.PRICES_PUBLISH)
  const locale = await getLocale()
  const fa = locale === "fa"

  const [brands, categories] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      select: { id: true, nameFa: true },
      orderBy: { nameFa: "asc" },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, nameFa: true },
      orderBy: { nameFa: "asc" },
    }),
  ])

  return (
    <BulkPriceClient
      brands={brands}
      categories={categories}
      locale={locale}
      fa={fa}
    />
  )
}
