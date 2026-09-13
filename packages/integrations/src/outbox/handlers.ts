import { Bot, InlineKeyboard, InputFile } from "grammy"
import { db } from "@tirajeh/database"
import { emailService } from "../email/service"
import { formatToman, escapeHtml } from "@tirajeh/shared"
import {
  renderPriceCardPng,
  classifyGroupTitle,
  stripGroupPrefix,
  type PriceCardGroup,
} from "../telegram/price-card"
import {
  buildPricePostText,
  getActiveProducts,
  getTodayJalaliString,
  type PriceFlowState,
} from "../telegram/price-flow"
import type { OrderStatus } from "@tirajeh/database"
import type { OrderConfirmationEmailProps } from "../email/service"

export type OutboxHandler = (payload: Record<string, unknown>) => Promise<void>

function getBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN env var is required")
  return new Bot(token, {
    client: {
      apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
    },
  })
}

function getAdminChatId(): string {
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!adminChat) throw new Error("TELEGRAM_ADMIN_CHAT_ID env var is required")
  return adminChat
}

export const channelHandlers: Record<string, OutboxHandler> = {
  tg_admin: async (payload: Record<string, unknown>) => {
    const bot = getBot()
    const adminChat = getAdminChatId()

    // 1. Check if raw pre-formatted message is provided
    if (typeof payload.message === "string" && payload.message.trim()) {
      await bot.api.sendMessage(adminChat, payload.message, { parse_mode: "HTML" })
      return
    }

    // 2. Order paid
    if (payload.orderNumber && payload.refId && payload.amount) {
      const toman = formatToman(Number(payload.amount), "fa")
      const text = [
        "✅ <b>پرداخت موفق</b>",
        `سفارش: <code>${escapeHtml(String(payload.orderNumber))}</code>`,
        `مبلغ: ${toman}`,
        `کد پیگیری: <code>${escapeHtml(String(payload.refId))}</code>`,
      ].join("\n")
      await bot.api.sendMessage(adminChat, text, { parse_mode: "HTML" })
      return
    }

    // 3. Order created
    if (payload.orderNumber && payload.customerName) {
      const toman = payload.totalAmount ? formatToman(Number(payload.totalAmount), "fa") : ""
      const text = [
        "🛒 <b>سفارش جدید</b>",
        `شماره: <code>${escapeHtml(String(payload.orderNumber))}</code>`,
        `مشتری: ${escapeHtml(String(payload.customerName))}`,
        toman ? `مبلغ: ${toman}` : null,
        payload.itemCount !== undefined ? `اقلام: ${payload.itemCount} قلم` : null,
        payload.city ? `شهر: ${escapeHtml(String(payload.city))}` : null,
      ]
        .filter(Boolean)
        .join("\n")
      await bot.api.sendMessage(adminChat, text, { parse_mode: "HTML" })
      return
    }

    // 4. Order status changed
    if (payload.orderNumber && payload.to) {
      const text = [
        "🔄 <b>تغییر وضعیت سفارش</b>",
        `سفارش: <code>${escapeHtml(String(payload.orderNumber))}</code>`,
        payload.from ? `از: ${escapeHtml(String(payload.from))}` : null,
        `به: <b>${escapeHtml(String(payload.to))}</b>`,
        payload.adminId ? `توسط ادمین: ${escapeHtml(String(payload.adminId))}` : null,
      ]
        .filter(Boolean)
        .join("\n")
      await bot.api.sendMessage(adminChat, text, { parse_mode: "HTML" })
      return
    }

    // 5. Quote created
    if (payload.quoteId || (payload.name && payload.productName && payload.quantityTon)) {
      const text = [
        "📋 <b>استعلام قیمت جدید</b>",
        `نام: ${escapeHtml(String(payload.name ?? ""))} (${escapeHtml(String(payload.customerType ?? "عادی"))})`,
        `محصول: ${escapeHtml(String(payload.productName ?? ""))}`,
        `مقدار: ${payload.quantityTon} تن`,
        `تلفن: <code>${escapeHtml(String(payload.phone ?? ""))}</code>`,
      ].join("\n")
      await bot.api.sendMessage(adminChat, text, { parse_mode: "HTML" })
      return
    }

    // 6. Contact created
    if (payload.contactId || (payload.name && payload.subject && payload.message)) {
      const sourceLabel = payload.source === "TELEGRAM" ? "ربات تلگرام" : "وبسایت"
      const text = [
        "📩 <b>پیام تماس / پشتیبانی جدید</b>",
        `منبع: <b>${escapeHtml(sourceLabel)}</b>`,
        `نام: ${escapeHtml(String(payload.name ?? ""))}`,
        payload.email ? `ایمیل: <code>${escapeHtml(String(payload.email))}</code>` : null,
        payload.phone ? `تلفن: <code>${escapeHtml(String(payload.phone))}</code>` : null,
        payload.category ? `دسته‌بندی: <b>${escapeHtml(String(payload.category))}</b>` : null,
        `موضوع: ${escapeHtml(String(payload.subject ?? ""))}`,
        "",
        "<b>پیام:</b>",
        escapeHtml(String(payload.message ?? "")),
      ]
        .filter(Boolean)
        .join("\n")
      await bot.api.sendMessage(adminChat, text, { parse_mode: "HTML" })
      return
    }

    // Fallback JSON dump to admin
    await bot.api.sendMessage(
      adminChat,
      `🔔 <b>اعلان ادمین</b>\n<code>${escapeHtml(JSON.stringify(payload, null, 2))}</code>`,
      { parse_mode: "HTML" }
    )
  },

  tg_channel: async (payload: Record<string, unknown>) => {
    const channelId = process.env.TELEGRAM_CHANNEL_ID
    if (!channelId) throw new Error("TELEGRAM_CHANNEL_ID env var is required")
    const bot = getBot()

    // 1. Raw post message
    if (typeof payload.message === "string" && payload.message.trim()) {
      await bot.api.sendMessage(channelId, payload.message, { parse_mode: "HTML" })
      return
    }

    // 2. Daily price bulletin published
    if (payload.bulletinId) {
      const bulletin = await db.dailyPriceBulletin.findUnique({
        where: { id: String(payload.bulletinId) },
        include: {
          items: {
            include: {
              product: {
                include: {
                  productCategories: { include: { category: true } },
                },
              },
            },
          },
        },
      })
      if (!bulletin) throw new Error(`Bulletin not found: ${payload.bulletinId}`)

      const products = await getActiveProducts()
      const fakeState: PriceFlowState = {
        step: "PREVIEW",
        page: 0,
        selected: bulletin.items.filter((i) => i.productId).map((i) => i.productId!),
        prices: Object.fromEntries(
          bulletin.items.filter((i) => i.productId).map((i) => [i.productId!, Number(i.price)])
        ),
        currentIdx: 0,
        newProducts: bulletin.items
          .filter((i) => !i.productId && i.customName)
          .map((i) => ({ name: i.customName!, price: Number(i.price) })),
      }
      const { text: postText } = await buildPricePostText(fakeState, products)

      const SITE_URL = (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
      const sitePhone = process.env.SITE_PHONE || "021-00000000"
      const siteDomain = SITE_URL.replace(/^https?:\/\//, "")
      const channelHandle = process.env.TELEGRAM_CHANNEL_USERNAME || "@tirajeconcrete"

      const keyboard = new InlineKeyboard().url("🛒 مشاهده و سفارش آنلاین", `${SITE_URL}/fa/products`)

      const productById = new Map(products.map((p) => [p.id, p]))
      const groupMap = new Map<string, PriceCardGroup>()
      for (const bi of bulletin.items) {
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
          price: Number(bi.price),
          previousPrice: bi.previousPrice ? Number(bi.previousPrice) : null,
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
        sentMsg = await bot.api.sendMessage(channelId, postText, { parse_mode: "HTML" })
      } catch (cardErr) {
        console.warn("[outbox:tg_channel] price-card image failed, falling back to text-only:", cardErr)
        sentMsg = await bot.api.sendMessage(channelId, postText, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
      }

      await db.dailyPriceBulletin.update({
        where: { id: bulletin.id },
        data: { telegramMsgId: String(sentMsg.message_id) },
      })
      return
    }

    // Fallback message
    await bot.api.sendMessage(channelId, String(payload.text ?? JSON.stringify(payload)), {
      parse_mode: "HTML",
    })
  },

  tg_user: async (payload: Record<string, unknown>) => {
    const chatId = payload.telegramChatId ?? payload.chatId
    if (!chatId) {
      console.warn("[outbox:tg_user] No telegramChatId provided, skipping", payload)
      return
    }
    const text = String(payload.message ?? payload.text ?? "")
    if (!text) return

    const bot = getBot()
    await bot.api.sendMessage(String(chatId), text, { parse_mode: "HTML" })
  },

  email: async (payload: Record<string, unknown>) => {
    const emailType = payload.emailType ?? payload.type

    // 1. Order confirmation email
    if (emailType === "order_confirmation" || (payload.orderNumber && payload.to && payload.items)) {
      await emailService.sendOrderConfirmation({
        to: String(payload.to),
        orderNumber: String(payload.orderNumber),
        customerName: String(payload.customerName ?? ""),
        items: (payload.items as unknown as OrderConfirmationEmailProps["items"]) ?? [],
        subtotalToman: Number(payload.subtotalToman ?? payload.totalAmount ?? 0),
        shippingToman: Number(payload.shippingToman ?? payload.freightCost ?? 0),
        totalToman: Number(payload.totalToman ?? payload.totalAmount ?? 0),
        status: String(payload.status ?? "CONFIRMED"),
      })
      return
    }

    // 2. Order status update email
    if (emailType === "order_status_update" || (payload.customerEmail && payload.newStatus && payload.orderNumber)) {
      await emailService.sendOrderStatusUpdate({
        customerName: String(payload.customerName ?? ""),
        customerEmail: String(payload.customerEmail),
        orderNumber: String(payload.orderNumber),
        newStatus: payload.newStatus as OrderStatus,
        note: payload.note ? String(payload.note) : undefined,
      })
      return
    }

    // 3. Contact notice email
    if (emailType === "contact_notice" || (payload.subject && payload.message && payload.name)) {
      await emailService.sendContactNotice({
        name: String(payload.name),
        email: String(payload.email ?? ""),
        phone: String(payload.phone ?? ""),
        subject: String(payload.subject),
        message: String(payload.message),
      })
      return
    }

    // 4. Raw HTML email
    if (payload.to && payload.subject && payload.html) {
      await emailService.sendContactEmail({
        to: String(payload.to),
        subject: String(payload.subject),
        html: String(payload.html),
        replyTo: payload.replyTo ? String(payload.replyTo) : undefined,
      })
      return
    }

    console.warn("[outbox:email] Unknown email payload structure:", payload)
  },

  sms: async (payload: Record<string, unknown>) => {
    console.log("[outbox:sms] no-op", payload)
  },
}
