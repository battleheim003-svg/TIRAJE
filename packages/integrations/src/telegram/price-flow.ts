/**
 * State machine for Telegram price declaration flow (/price).
 */
import { InlineKeyboard, Context } from "grammy"
import { createClient } from "redis"
import { db } from "@tirajeh/database"
import { buildProductHashtags } from "./hashtags"

export type PriceFlowStep =
  | "SELECTING"
  | "ADDING_NEW_PRODUCT_NAME"
  | "ADDING_NEW_PRODUCT_PRICE"
  | "PRICING"
  | "PREVIEW"

export interface PriceFlowState {
  step: PriceFlowStep
  page: number
  selected: string[] // product IDs
  prices: Record<string, number>
  currentIdx: number
  newProducts: Array<{ name: string; price: number }>
  pendingNewProductName?: string
}

const FLOW_TTL = 1800 // 30 mins
const PAGE_SIZE = 8

function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  return createClient({ url })
}

const memoryFlow = new Map<number | string, { state: PriceFlowState; expiresAt: number }>()

const flowKey = (chatId: number | string) => `tg:price_flow:${chatId}`

export async function getPriceFlowState(chatId: number | string): Promise<PriceFlowState | null> {
  const redis = getRedis()
  if (!redis) {
    const item = memoryFlow.get(chatId)
    if (item && item.expiresAt > Date.now()) {
      return item.state
    }
    memoryFlow.delete(chatId)
    return null
  }
  try {
    await redis.connect()
    const data = await redis.get(flowKey(chatId))
    await redis.disconnect()
    if (!data) return null
    return JSON.parse(data) as PriceFlowState
  } catch (err) {
    console.warn("[telegram:redis] getPriceFlowState error, falling back to memory:", err)
    const item = memoryFlow.get(chatId)
    return item && item.expiresAt > Date.now() ? item.state : null
  }
}

export async function savePriceFlowState(
  chatId: number | string,
  state: PriceFlowState
): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    memoryFlow.set(chatId, { state, expiresAt: Date.now() + FLOW_TTL * 1000 })
    return
  }
  try {
    await redis.connect()
    await redis.set(flowKey(chatId), JSON.stringify(state), { EX: FLOW_TTL })
    await redis.disconnect()
  } catch (err) {
    console.warn("[telegram:redis] savePriceFlowState error, falling back to memory:", err)
    memoryFlow.set(chatId, { state, expiresAt: Date.now() + FLOW_TTL * 1000 })
  }
}

export async function clearPriceFlowState(chatId: number | string): Promise<void> {
  const redis = getRedis()
  memoryFlow.delete(chatId)
  if (!redis) return
  try {
    await redis.connect()
    await redis.del(flowKey(chatId))
    await redis.disconnect()
  } catch (err) {
    console.warn("[telegram:redis] clearPriceFlowState error:", err)
  }
}

// ─── Jalali date helper ───────────────────────────────────────────────────────

export function getTodayJalaliString(): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "full",
      timeZone: "Asia/Tehran",
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date())
  }
}

// ─── Fetch active products ────────────────────────────────────────────────────

export async function getActiveProducts() {
  return db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameFa: true,
      packagingType: true,
      price: true,
      cementType: true,
      brand: { select: { nameFa: true } },
      productCategories: {
        select: {
          category: { select: { nameFa: true } },
        },
      },
    },
    orderBy: [{ brandId: "asc" }, { nameFa: "asc" }],
  })
}

// ─── Flow steps ───────────────────────────────────────────────────────────────

export async function startPriceFlow(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id
  if (!chatId) return

  const state: PriceFlowState = {
    step: "SELECTING",
    page: 0,
    selected: [],
    prices: {},
    currentIdx: 0,
    newProducts: [],
  }

  await savePriceFlowState(chatId, state)
  const products = await getActiveProducts()
  await sendProductSelectionPage(ctx, state, products, false)
}

export async function sendProductSelectionPage(
  ctx: Context,
  state: PriceFlowState,
  products: Awaited<ReturnType<typeof getActiveProducts>>,
  isEdit = true
): Promise<void> {
  const totalPages = Math.ceil(products.length / PAGE_SIZE) || 1
  const currentPage = Math.min(Math.max(0, state.page), totalPages - 1)
  state.page = currentPage

  const pageItems = products.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  const keyboard = new InlineKeyboard()

  // Product items (1 per row)
  for (const prod of pageItems) {
    const isSelected = state.selected.includes(prod.id)
    const icon = isSelected ? "✅" : "◻️"
    keyboard.text(`${icon} ${prod.nameFa}`, `price_toggle:${prod.id}`).row()
  }

  // Navigation row
  const navRow: Array<{ text: string; data: string }> = []
  if (currentPage > 0) {
    navRow.push({ text: "⬅️ قبلی", data: `price_page:${currentPage - 1}` })
  }
  navRow.push({
    text: `📄 صفحه ${currentPage + 1} از ${totalPages}`,
    data: "noop",
  })
  if (currentPage < totalPages - 1) {
    navRow.push({ text: "بعدی ➡️", data: `price_page:${currentPage + 1}` })
  }
  for (const btn of navRow) {
    keyboard.text(btn.text, btn.data)
  }
  keyboard.row()

  // Action row
  keyboard.text("➕ محصول جدید", "price_new_product")
  const totalSelectedCount = state.selected.length + state.newProducts.length
  if (totalSelectedCount > 0) {
    keyboard.text(`✅ تأیید (${totalSelectedCount} انتخاب)`, "price_confirm_select")
  }
  keyboard.row()
  keyboard.text("❌ لغو عملیات", "price_cancel")

  const extraNewText =
    state.newProducts.length > 0
      ? `\n\n📌 محصولات جدید جلسه:\n` +
        state.newProducts.map((p) => `• ${p.name}: ${Math.round(p.price).toLocaleString("fa-IR")} تومان`).join("\n")
      : ""

  const text =
    `📋 <b>انتخاب محصولات جهت اعلام قیمت</b>\n\n` +
    `محصولات مورد نظر برای اعلام قیمت روز را با کلیک روی آنها انتخاب کنید:` +
    extraNewText

  if (isEdit) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
      return
    } catch {
      // If edit fails (e.g. content same), fall back to reply
    }
  }

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  })
}

export async function askNextPrice(
  ctx: Context,
  state: PriceFlowState,
  products: Awaited<ReturnType<typeof getActiveProducts>>
): Promise<void> {
  const total = state.selected.length
  const currentProdId = state.selected[state.currentIdx]
  const prod = products.find((p) => p.id === currentProdId)
  const prodName = prod ? prod.nameFa : "محصول"

  const keyboard = new InlineKeyboard().text("❌ لغو", "price_cancel")

  await ctx.reply(
    `💰 قیمت <b>${prodName}</b> را وارد کن (تومان):\n\n` +
      `📌 محصول ${state.currentIdx + 1} از ${total}`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  )
}

export async function buildPricePostText(
  state: PriceFlowState,
  products: Awaited<ReturnType<typeof getActiveProducts>>
): Promise<{ text: string; hashtags: string[] }> {
  const jalaliDate = getTodayJalaliString()
  const sitePhone = process.env.SITE_PHONE || "021-00000000"
  const siteUrl = process.env.SITE_URL || "https://tirajeconcrete.com"
  const channelUsername =
    process.env.TELEGRAM_CHANNEL_USERNAME || "@tirajeconcrete"

  const lines: string[] = []
  lines.push("📦 <b>لیست قیمت محصولات تیراژه</b>")
  lines.push("━━━━━━━━━━━━━━━━━━━━━")
  lines.push(`📅 <b>تاریخ:</b> ${jalaliDate}\n`)

  const allCategories: string[] = []
  const brands: string[] = []

  for (const prodId of state.selected) {
    const prod = products.find((p) => p.id === prodId)
    if (!prod) continue
    const price = state.prices[prodId] ?? Number(prod.price)
    const formattedPrice = Math.round(price).toLocaleString("fa-IR")
    
    let packLabel = ""
    if (prod.packagingType === "BAG_50KG") packLabel = " — کیسه ۵۰ کیلوگرمی"
    else if (prod.packagingType === "JUMBO_1500KG") packLabel = " — جامبوبگ"
    else if (prod.packagingType === "BULK") packLabel = " — فله"

    lines.push(`🔹 <b>${prod.nameFa}</b>${packLabel}`)
    lines.push(`💰 <b>${formattedPrice}</b> تومان\n`)

    if (prod.brand?.nameFa) brands.push(prod.brand.nameFa)
    for (const pc of prod.productCategories) {
      if (pc.category.nameFa) allCategories.push(pc.category.nameFa)
    }
  }

  for (const np of state.newProducts) {
    const formattedPrice = Math.round(np.price).toLocaleString("fa-IR")
    lines.push(`🔹 <b>${np.name}</b>`)
    lines.push(`💰 <b>${formattedPrice}</b> تومان\n`)
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━")
  lines.push(`📞 ثبت سفارش: <code>${sitePhone}</code>`)
  lines.push(`🌐 ${siteUrl}\n`)

  const tags = buildProductHashtags({
    categoriesFa: allCategories,
    brandFa: brands[0] ?? null,
  })
  tags.push("#لیست_قیمت", "#قیمت_روز")
  const uniqueTags = [...new Set(tags)]

  lines.push(uniqueTags.join(" "))
  lines.push(`\n${channelUsername}`)

  return { text: lines.join("\n"), hashtags: uniqueTags }
}

export async function showPricePreview(
  ctx: Context,
  state: PriceFlowState,
  products: Awaited<ReturnType<typeof getActiveProducts>>
): Promise<void> {
  const { text } = await buildPricePostText(state, products)

  const keyboard = new InlineKeyboard()
    .text("✅ ارسال به کانال", "price_send")
    .text("✏️ ویرایش قیمت‌ها", "price_edit")
    .row()
    .text("❌ لغو", "price_cancel")

  await ctx.reply(
    `👀 <b>پیش‌نمایش پست اعلام قیمت:</b>\n\n${text}`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  )
}
