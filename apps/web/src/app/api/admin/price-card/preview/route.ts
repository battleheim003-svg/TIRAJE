import { NextRequest, NextResponse } from "next/server"
import { auth } from "@tirajeh/auth"
import { PERMISSIONS } from "@tirajeh/shared"
import { db } from "@tirajeh/database"
import {
  renderPriceCardPng,
  classifyGroupTitle,
  stripGroupPrefix,
  type PriceCardGroup,
} from "@tirajeh/integrations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userPerms = (session.user as { permissions?: string[] }).permissions ?? []
  if (!userPerms.includes("*") && !userPerms.includes(PERMISSIONS.PRICES_PUBLISH)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // items format: ?items=productId1:price1,productId2:price2
  const itemsParam = req.nextUrl.searchParams.get("items")
  if (!itemsParam) {
    return NextResponse.json({ error: "items required" }, { status: 400 })
  }

  // Parse items
  const parsedItems: Array<{ productId: string; price: number }> = []
  for (const part of itemsParam.split(",")) {
    const [productId, priceStr] = part.split(":")
    if (productId && priceStr) {
      const price = Number(priceStr)
      if (!isNaN(price) && price > 0) {
        parsedItems.push({ productId, price })
      }
    }
  }

  if (parsedItems.length === 0) {
    return NextResponse.json({ error: "No valid items provided" }, { status: 400 })
  }

  // Fetch products
  const productIds = parsedItems.map((i) => i.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      nameFa: true,
      packagingType: true,
      price: true,
      productCategories: {
        select: {
          category: { select: { nameFa: true } },
        },
      },
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  // Group items
  const groupMap = new Map<string, PriceCardGroup>()
  for (const item of parsedItems) {
    const prod = productMap.get(item.productId)
    const rawName = prod?.nameFa ?? "محصول"
    const groupTitle = classifyGroupTitle({
      name: rawName,
      packagingType: prod?.packagingType ?? null,
      categoryNames: prod?.productCategories.map((pc) => pc.category.nameFa) ?? [],
    })

    if (!groupMap.has(groupTitle)) {
      groupMap.set(groupTitle, { title: groupTitle, items: [] })
    }

    groupMap.get(groupTitle)!.items.push({
      id: item.productId,
      name: stripGroupPrefix(rawName, groupTitle),
      price: item.price,
      previousPrice: prod ? Number(prod.price) : null,
    })
  }

  const todayJalali = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date())

  const sitePhone = process.env.SITE_PHONE || "021-00000000"
  const siteUrl = (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
  const siteDomain = siteUrl.replace(/^https?:\/\//, "")
  const channelHandle = process.env.TELEGRAM_CHANNEL_USERNAME || "@TirajehConcrete"

  try {
    const pngBuffer = renderPriceCardPng({
      dateLabel: todayJalali,
      groups: [...groupMap.values()],
      sitePhone,
      siteDomain,
      channelHandle,
    })

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (err: unknown) {
    console.error("[price-card:preview] Error rendering PNG:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generating preview PNG" },
      { status: 500 }
    )
  }
}
