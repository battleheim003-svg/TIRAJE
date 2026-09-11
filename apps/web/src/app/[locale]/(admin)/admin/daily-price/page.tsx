import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { getProductsForPricingAction, getActiveBulletinAction } from "@/actions/admin-daily-price"
import { DailyPriceForm, PricingProduct, ActiveBulletin } from "./daily-price-form"

export const metadata: Metadata = {
  title: "اعلام قیمت روز | پنل مدیریت تیراژه",
}

export default async function AdminDailyPricePage() {
  const locale = await getLocale()

  const [products, activeBulletin] = await Promise.all([
    getProductsForPricingAction(),
    getActiveBulletinAction(),
  ])

  return (
    <DailyPriceForm
      products={products as unknown as PricingProduct[]}
      activeBulletin={activeBulletin as unknown as ActiveBulletin | null}
      locale={locale}
    />
  )
}
