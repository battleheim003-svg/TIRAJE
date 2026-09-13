import { db } from "@tirajeh/database"
import { tehranDayStart, tehranDateKey } from "@tirajeh/shared"
import {
  buildPricePostText,
  getActiveProducts,
  getTodayJalaliString,
  type PriceFlowState,
} from "./price-flow"
import {
  renderPriceCardPng,
  classifyGroupTitle,
  stripGroupPrefix,
  type PriceCardGroup,
} from "./price-card"

export interface PriceSubmission {
  productId: string
  price: number
}

export interface CustomProductPrice {
  name: string
  price: number
}

export interface PublishDailyPriceParams {
  items: PriceSubmission[]
  customItems?: CustomProductPrice[]
  source: "ADMIN_PANEL" | "TELEGRAM"
  publishedBy?: string // userId (for admin panel)
}

/**
 * Core function: creates a DailyPriceBulletin, updates product prices,
 * records price history, and optionally sends to Telegram channel.
 * Called from both admin panel actions and the Telegram bot /price flow.
 */
export async function publishDailyPrice(params: PublishDailyPriceParams): Promise<{
  bulletinId: string
  telegramSent: boolean
  error?: string
}> {
  const today = tehranDayStart()
  const dateKey = tehranDateKey(today)

  // 1. Upsert the bulletin for today (replace if same day)
  const existingBulletin = await db.dailyPriceBulletin.findFirst({
    where: {
      OR: [
        { dateKey },
        { date: today },
      ],
    },
    include: { items: true },
  })

  if (existingBulletin) {
    // Delete old items, we'll recreate
    await db.dailyPriceItem.deleteMany({
      where: { bulletinId: existingBulletin.id },
    })
  }

  const bulletin = existingBulletin
    ? await db.dailyPriceBulletin.update({
        where: { id: existingBulletin.id },
        data: {
          dateKey,
          source: params.source,
          publishedBy: params.publishedBy ?? existingBulletin.publishedBy,
          isActive: true,
        },
      })
    : await db.dailyPriceBulletin.create({
        data: {
          date: today,
          dateKey,
          source: params.source,
          publishedBy: params.publishedBy ?? null,
          isActive: true,
        },
      })

  // 2. Update product prices + create price history + create bulletin items
  const bulletinItems: Array<{
    productId?: string
    customName?: string
    price: number
    previousPrice?: number
    sortOrder: number
  }> = []

  for (let i = 0; i < params.items.length; i++) {
    const { productId, price } = params.items[i]
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { price: true },
    })

    const oldPrice = product ? Number(product.price) : 0

    // Update product price
    await db.product.update({
      where: { id: productId },
      data: {
        price: price,
        lastPriceUpdate: new Date(),
      },
    })

    // Record price history (if publishedBy is available and price changed)
    if (params.publishedBy && oldPrice !== price) {
      await db.productPriceHistory.create({
        data: {
          productId,
          oldPrice: oldPrice,
          newPrice: price,
          changedBy: params.publishedBy,
          reason:
            params.source === "TELEGRAM"
              ? "اعلام قیمت روز (تلگرام)"
              : "اعلام قیمت روز (پنل ادمین)",
        },
      })
    }

    bulletinItems.push({
      productId,
      price,
      previousPrice: oldPrice,
      sortOrder: i,
    })
  }

  // Custom products (from Telegram flow)
  if (params.customItems) {
    for (let i = 0; i < params.customItems.length; i++) {
      bulletinItems.push({
        customName: params.customItems[i].name,
        price: params.customItems[i].price,
        sortOrder: params.items.length + i,
      })
    }
  }

  // 3. Bulk create bulletin items
  if (bulletinItems.length > 0) {
    await db.dailyPriceItem.createMany({
      data: bulletinItems.map((item) => ({
        bulletinId: bulletin.id,
        productId: item.productId ?? null,
        customName: item.customName ?? null,
        price: item.price,
        previousPrice: item.previousPrice ?? null,
        sortOrder: item.sortOrder,
      })),
    })
  }

  // 4. Send to Telegram channel
  let telegramSent = false
  let telegramError: string | undefined
  try {
    const channelId = process.env.TELEGRAM_CHANNEL_ID
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (channelId && botToken) {
      // Build the same format as the existing /price flow
      const products = await getActiveProducts()
      const fakeState: PriceFlowState = {
        step: "PREVIEW",
        page: 0,
        selected: params.items.map((i) => i.productId),
        prices: Object.fromEntries(params.items.map((i) => [i.productId, i.price])),
        currentIdx: 0,
        newProducts: (params.customItems ?? []).map((c) => ({
          name: c.name,
          price: c.price,
        })),
      }
      const { text: postText } = await buildPricePostText(fakeState, products)
      const SITE_URL = (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
      const sitePhone = process.env.SITE_PHONE || "021-00000000"
      const siteDomain = SITE_URL.replace(/^https?:\/\//, "")
      const channelHandle = process.env.TELEGRAM_CHANNEL_USERNAME || "@tirajeconcrete"

      const { Bot, InlineKeyboard, InputFile } = await import("grammy")
      const bot = new Bot(botToken, {
        client: {
          apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
        },
      })
      const keyboard = new InlineKeyboard().url("🛒 مشاهده و سفارش آنلاین", `${SITE_URL}/fa/products`)

      // Build the price-card image data: group each priced item the same way
      // the storefront groups them, using data already fetched above.
      const productById = new Map(products.map((p) => [p.id, p]))
      const groupMap = new Map<string, PriceCardGroup>()
      for (const bi of bulletinItems) {
        const product = bi.productId ? productById.get(bi.productId) : undefined
        const rawName = product?.nameFa ?? bi.customName ?? "محصول"
        const groupTitle = classifyGroupTitle({
          name: rawName,
          packagingType: product?.packagingType ?? null,
          categoryNames: product?.productCategories?.map((pc) => pc.category?.nameFa ?? "") ?? [],
        })
        if (!groupMap.has(groupTitle)) groupMap.set(groupTitle, { title: groupTitle, items: [] })
        groupMap.get(groupTitle)!.items.push({
          id: bi.productId ?? `custom-${bi.sortOrder}`,
          name: stripGroupPrefix(rawName, groupTitle),
          price: bi.price,
          previousPrice: bi.previousPrice ?? null,
        })
      }

      let sentMsg: { message_id: number }
      try {
        const cardBuffer = renderPriceCardPng({
          dateLabel: getTodayJalaliString(),
          groups: [...groupMap.values()],
          sitePhone,
          siteDomain,
          channelHandle,
        })
        await bot.api.sendPhoto(channelId, new InputFile(cardBuffer, "price-card.png"), {
          caption: `📋 لیست قیمت روز تیراژه به‌روزرسانی شد — جزئیات در تصویر`,
          reply_markup: keyboard,
        })
        // The card image carries the actual list; this text follow-up keeps
        // the data machine-readable/searchable in the channel and is what
        // gets edited on same-day re-publish (see editMessageText usage
        // elsewhere) — the image itself isn't editable in place per-row.
        sentMsg = await bot.api.sendMessage(channelId, postText, { parse_mode: "HTML" })
      } catch (cardErr) {
        console.warn("[daily-price] price-card image failed, falling back to text-only:", cardErr)
        sentMsg = await bot.api.sendMessage(channelId, postText, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
      }

      // Save telegram message ID to bulletin
      await db.dailyPriceBulletin.update({
        where: { id: bulletin.id },
        data: { telegramMsgId: String(sentMsg.message_id) },
      })
      telegramSent = true
    }
  } catch (err: unknown) {
    telegramError = err instanceof Error ? err.message : String(err)
    console.error("[daily-price] Failed to send to Telegram channel:", err)
  }

  return {
    bulletinId: bulletin.id,
    telegramSent,
    error: telegramError,
  }
}

/**
 * Get the active (latest) daily price bulletin for display on the website ticker.
 */
export async function getActiveDailyPriceBulletin() {
  return db.dailyPriceBulletin.findFirst({
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
}
