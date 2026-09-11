import { getActiveDailyPriceBulletin } from "@tirajeh/integrations"
import { NextResponse } from "next/server"

export async function GET() {
  const bulletin = await getActiveDailyPriceBulletin()
  if (!bulletin) {
    return NextResponse.json({ items: [] })
  }
  return NextResponse.json({
    date: bulletin.date,
    createdAt: bulletin.createdAt,
    items: bulletin.items.map((item) => ({
      id: item.id,
      nameFa: item.product?.nameFa ?? item.customName,
      nameEn: item.product?.nameEn ?? item.customName,
      slug: item.product?.slug ?? null,
      packagingType: item.product?.packagingType ?? null,
      price: Number(item.price),
      previousPrice: item.previousPrice ? Number(item.previousPrice) : null,
    })),
  })
}

export const revalidate = 60
