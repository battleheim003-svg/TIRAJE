import { db } from "@tirajeh/database"
import { PriceTickerClient } from "./price-ticker-client"

export async function PriceTicker({ locale }: { locale: string }) {
  const bulletin = await db.dailyPriceBulletin.findFirst({
    where: { isActive: true },
    orderBy: { date: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              nameFa: true,
              nameEn: true,
              slug: true,
              packagingType: true,
            },
          },
        },
      },
    },
  })

  if (!bulletin || bulletin.items.length === 0) return null

  const items = bulletin.items.map((item) => ({
    id: item.id,
    name: item.product?.nameFa ?? item.customName ?? "—",
    nameEn: item.product?.nameEn ?? item.customName ?? "—",
    price: Number(item.price),
    previousPrice: item.previousPrice ? Number(item.previousPrice) : null,
    slug: item.product?.slug ?? null,
    packaging: item.product?.packagingType ?? null,
  }))

  const jalaliDate = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(new Date(bulletin.date))

  return (
    <PriceTickerClient
      items={items}
      date={jalaliDate}
      locale={locale}
    />
  )
}
