/**
 * Telegram notification and channel publication service.
 *
 * Architecture:
 *  - All outbound admin notifications are pushed onto a Redis list (send queue).
 *  - Channel posts (blog posts & products) are published directly to Telegram Channel
 *    with Inline Keyboard buttons and logged to the TelegramLog table.
 *  - Existing channel messages are edited if already posted.
 *  - Scheduled posts are published automatically via publishScheduledPosts().
 */
import { Bot, InlineKeyboard } from "grammy"
import { createClient } from "redis"
import { db } from "@tirajeh/database"
import { formatToman, escapeHtml } from "@tirajeh/shared"
import { buildPostHashtags, buildProductHashtags } from "./hashtags"

const QUEUE_KEY = "tg:send_queue"

// ─── Redis queue helper ───────────────────────────────────────────────────────

function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  return createClient({ url })
}

interface QueuedMessage {
  chatId: string | number
  text: string
  parseMode?: "HTML" | "Markdown"
}

/** Push a message onto the send queue (or send directly if Redis is not configured in local dev) */
export async function enqueueTelegramMessage(msg: QueuedMessage): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (token) {
      const bot = new Bot(token)
      await bot.api
        .sendMessage(msg.chatId, msg.text, {
          parse_mode: msg.parseMode ?? "HTML",
        })
        .catch((err) => console.error("[telegram:directFallback]", err))
    }
    return
  }

  await redis.connect()
  await redis.rPush(QUEUE_KEY, JSON.stringify(msg))
  await redis.disconnect()
}

// ─── Worker — drain queue (called by cron / serverless schedule) ──────────────

export async function drainTelegramQueue(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN env var is required")

  const bot = new Bot(token)
  const redis = getRedis()
  if (!redis) {
    console.warn("[telegram:drain] Redis is not configured, skipping drain.")
    return
  }
  await redis.connect()

  let raw: string | null
  let processed = 0
  const MAX_PER_DRAIN = 50 // Telegram rate limit: ~30 msgs/sec per bot

  while (processed < MAX_PER_DRAIN && (raw = await redis.lPop(QUEUE_KEY)) !== null) {
    try {
      const msg = JSON.parse(raw) as QueuedMessage
      await bot.api.sendMessage(msg.chatId, msg.text, {
        parse_mode: msg.parseMode ?? "HTML",
      })
      processed++
    } catch (err) {
      console.error("[telegram:drain]", err)
      // Re-queue failed message at front so it retries first
      await redis.lPush(QUEUE_KEY, raw)
      break // Stop draining to avoid hammering a rate-limited API
    }
  }

  await redis.disconnect()
}

// ─── Notification helpers ─────────────────────────────────────────────────────

const ADMIN_CHAT = () => {
  const id = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!id) throw new Error("TELEGRAM_ADMIN_CHAT_ID env var is required")
  return id
}

export async function notifyNewOrder(params: {
  orderNumber: string
  customerName: string
  totalAmount: number
  itemCount: number
  city: string
}) {
  const toman = formatToman(params.totalAmount, "fa")
  const text = [
    "🛒 <b>سفارش جدید</b>",
    `شماره: <code>${escapeHtml(params.orderNumber)}</code>`,
    `مشتری: ${escapeHtml(params.customerName)}`,
    `مبلغ: ${toman}`,
    `اقلام: ${params.itemCount} قلم`,
    `شهر: ${escapeHtml(params.city)}`,
  ].join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}

export async function notifyNewQuote(params: {
  name: string
  productName: string
  quantityTon: number
  phone: string
  customerType: string
}) {
  const text = [
    "📋 <b>استعلام قیمت جدید</b>",
    `نام: ${escapeHtml(params.name)} (${escapeHtml(params.customerType)})`,
    `محصول: ${escapeHtml(params.productName)}`,
    `مقدار: ${params.quantityTon} تن`,
    `تلفن: <code>${escapeHtml(params.phone)}</code>`,
  ].join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}

export async function notifyPaymentReceived(params: {
  orderNumber: string
  amount: number
  refId: string
}) {
  const toman = formatToman(params.amount, "fa")
  const text = [
    "✅ <b>پرداخت موفق</b>",
    `سفارش: <code>${escapeHtml(params.orderNumber)}</code>`,
    `مبلغ: ${toman}`,
    `کد پیگیری: <code>${escapeHtml(params.refId)}</code>`,
  ].join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}

export async function notifyNewContact(params: {
  name: string
  email?: string | null
  phone?: string | null
  subject: string
  message: string
  category?: string | null
  source?: string
}) {
  const sourceLabel = params.source === "TELEGRAM" ? "ربات تلگرام" : "وبسایت"
  const text = [
    "📩 <b>پیام تماس / پشتیبانی جدید</b>",
    `منبع: <b>${escapeHtml(sourceLabel)}</b>`,
    `نام: ${escapeHtml(params.name)}`,
    params.email ? `ایمیل: <code>${escapeHtml(params.email)}</code>` : null,
    params.phone ? `تلفن: <code>${escapeHtml(params.phone)}</code>` : null,
    params.category ? `دسته‌بندی: <b>${escapeHtml(params.category)}</b>` : null,
    `موضوع: ${escapeHtml(params.subject)}`,
    "",
    "<b>پیام:</b>",
    escapeHtml(params.message),
  ]
    .filter(Boolean)
    .join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}

// ─── Channel publication helpers ─────────────────────────────────────────────

function truncateCaption(text: string, max = 900): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…"
}

function buildCaption(params: {
  emoji: string
  title: string
  body: string
  hashtags: string[]
  channelUsername: string
}): string {
  const parts = [`${params.emoji} <b>${escapeHtml(params.title)}</b>`, ""]
  if (params.body) {
    parts.push(escapeHtml(truncateCaption(params.body)), "")
  }
  if (params.hashtags.length > 0) {
    parts.push(params.hashtags.map((h) => escapeHtml(h)).join(" "), "")
  }
  if (params.channelUsername) {
    parts.push(escapeHtml(params.channelUsername))
  }
  return parts.join("\n").trim()
}

function getSiteUrl(): string {
  return (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
}

function getBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null
  return new Bot(token)
}

export async function publishPostToChannel(post: {
  id: string
  titleFa: string
  excerptFa: string | null
  featuredImage: string | null
  categoryFa?: string | null
  tagsFa: string[]
  slug: string
  customHashtags?: string[]
  channelUsername?: string
}): Promise<void> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID
  const channelUsername = post.channelUsername || process.env.TELEGRAM_CHANNEL_USERNAME || "@TirajehConcrete"
  const bot = getBot()

  if (!channelId || !bot) {
    console.warn("[telegram:publishPost] Channel ID or Bot token not configured; skipping.")
    return
  }

  const siteUrl = getSiteUrl()
  const postUrl = `${siteUrl}/fa/blog/${post.slug}`
  const hashtags =
    post.customHashtags && post.customHashtags.length > 0
      ? post.customHashtags
      : buildPostHashtags({ categoryFa: post.categoryFa, tagFa: post.tagsFa })
  const caption = buildCaption({
    emoji: "📰",
    title: post.titleFa,
    body: post.excerptFa || "",
    hashtags,
    channelUsername,
  })

  const keyboard = new InlineKeyboard().url("📖 مطالعه مقاله کامل", postUrl)

  try {
    // Check if this post was already published to the channel
    const existingLog = await db.telegramLog.findFirst({
      where: {
        entityType: "post",
        entityId: post.id,
        status: { in: ["SENT", "UPDATED"] },
        telegramMessageId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    })

    if (existingLog?.telegramMessageId) {
      try {
        try {
          await bot.api.editMessageCaption(channelId, existingLog.telegramMessageId, {
            caption,
            parse_mode: "HTML",
            reply_markup: keyboard,
          })
        } catch {
          await bot.api.editMessageText(channelId, existingLog.telegramMessageId, caption, {
            parse_mode: "HTML",
            reply_markup: keyboard,
          })
        }

        await db.telegramLog.create({
          data: {
            entityType: "post",
            entityId: post.id,
            channelId: String(channelId),
            telegramMessageId: existingLog.telegramMessageId,
            status: "UPDATED",
            sentAt: new Date(),
          },
        })
        return
      } catch (editErr: any) {
        if (editErr?.description?.includes("message is not modified")) {
          return // Content is identical, nothing to update
        }
        console.warn("[telegram:publishPost] Edit existing message failed, posting fresh:", editErr)
      }
    }

    let sentMsg: { message_id: number }
    if (post.featuredImage) {
      try {
        sentMsg = await bot.api.sendPhoto(channelId, post.featuredImage, {
          caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
      } catch (photoErr) {
        console.warn("[telegram:publishPost] sendPhoto failed, falling back to sendMessage:", photoErr)
        sentMsg = await bot.api.sendMessage(channelId, caption, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
      }
    } else {
      sentMsg = await bot.api.sendMessage(channelId, caption, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
    }

    await db.telegramLog.create({
      data: {
        entityType: "post",
        entityId: post.id,
        channelId: String(channelId),
        telegramMessageId: sentMsg.message_id,
        status: "SENT",
        sentAt: new Date(),
      },
    })
  } catch (err: unknown) {
    console.error("[telegram:publishPost] Error publishing post to channel:", err)
    await db.telegramLog.create({
      data: {
        entityType: "post",
        entityId: post.id,
        channelId: String(channelId),
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => {})
  }
}

export async function publishProductToChannel(product: {
  id: string
  nameFa: string
  descriptionFa: string | null
  primaryImageUrl: string | null
  price: number
  categoriesFa: string[]
  brandFa?: string | null
  cementTypeLabelFa?: string | null
  packagingLabelFa?: string | null
  slug: string
  customHashtags?: string[]
  channelUsername?: string
}): Promise<void> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID
  const channelUsername = product.channelUsername || process.env.TELEGRAM_CHANNEL_USERNAME || "@TirajehConcrete"
  const bot = getBot()

  if (!channelId || !bot) {
    console.warn("[telegram:publishProduct] Channel ID or Bot token not configured; skipping.")
    return
  }

  // If no primary image, skip and log as requested
  if (!product.primaryImageUrl) {
    await db.telegramLog.create({
      data: {
        entityType: "product",
        entityId: product.id,
        channelId: String(channelId),
        status: "SKIPPED_NO_IMAGE",
        errorMessage: "محصول تصویر اصلی ندارد",
      },
    }).catch(() => {})
    return
  }

  const siteUrl = getSiteUrl()
  const productUrl = `${siteUrl}/fa/products/${product.slug}`
  const hashtags =
    product.customHashtags && product.customHashtags.length > 0
      ? product.customHashtags
      : buildProductHashtags({
          categoriesFa: product.categoriesFa,
          brandFa: product.brandFa,
          cementTypeLabelFa: product.cementTypeLabelFa,
          packagingLabelFa: product.packagingLabelFa,
        })

  const priceToman = Math.round(product.price).toLocaleString("fa-IR")
  const descWithPrice = product.descriptionFa
    ? `${product.descriptionFa}\n\n💰 قیمت: ${priceToman} تومان`
    : `💰 قیمت: ${priceToman} تومان`

  const caption = buildCaption({
    emoji: "🧱",
    title: product.nameFa,
    body: descWithPrice,
    hashtags,
    channelUsername,
  })

  const keyboard = new InlineKeyboard().url("🛒 مشاهده و خرید محصول", productUrl)

  try {
    const existingLog = await db.telegramLog.findFirst({
      where: {
        entityType: "product",
        entityId: product.id,
        status: { in: ["SENT", "UPDATED"] },
        telegramMessageId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    })

    if (existingLog?.telegramMessageId) {
      try {
        await bot.api.editMessageCaption(channelId, existingLog.telegramMessageId, {
          caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
        })

        await db.telegramLog.create({
          data: {
            entityType: "product",
            entityId: product.id,
            channelId: String(channelId),
            telegramMessageId: existingLog.telegramMessageId,
            status: "UPDATED",
            sentAt: new Date(),
          },
        })
        return
      } catch (editErr: any) {
        if (editErr?.description?.includes("message is not modified")) {
          return // Content is identical, nothing to update
        }
        console.warn("[telegram:publishProduct] Edit existing message failed, posting fresh:", editErr)
      }
    }

    let sentMsg: { message_id: number }
    try {
      sentMsg = await bot.api.sendPhoto(channelId, product.primaryImageUrl, {
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
    } catch (photoErr) {
      console.warn("[telegram:publishProduct] sendPhoto failed, falling back to sendMessage:", photoErr)
      sentMsg = await bot.api.sendMessage(channelId, caption, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
    }

    await db.telegramLog.create({
      data: {
        entityType: "product",
        entityId: product.id,
        channelId: String(channelId),
        telegramMessageId: sentMsg.message_id,
        status: "SENT",
        sentAt: new Date(),
      },
    })
  } catch (err: unknown) {
    console.error("[telegram:publishProduct] Error publishing product to channel:", err)
    await db.telegramLog.create({
      data: {
        entityType: "product",
        entityId: product.id,
        channelId: String(channelId),
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    }).catch(() => {})
  }
}

export async function publishScheduledPosts(): Promise<number> {
  try {
    const posts = await db.post.findMany({
      where: {
        status: "SCHEDULED",
        publishedAt: { lte: new Date() },
      },
      include: {
        category: true,
        postTags: { include: { tag: true } },
      },
    })

    let count = 0
    for (const post of posts) {
      try {
        await db.post.update({
          where: { id: post.id },
          data: { status: "PUBLISHED" },
        })
        await publishPostToChannel({
          id: post.id,
          titleFa: post.titleFa,
          excerptFa: post.excerptFa,
          featuredImage: post.featuredImage,
          categoryFa: post.category?.nameFa ?? null,
          tagsFa: post.postTags.map((pt) => pt.tag.nameFa),
          slug: post.slug,
        })
        count++
      } catch (itemErr) {
        console.error(`[telegram:publishScheduledPosts] Failed for post ${post.id}:`, itemErr)
      }
    }
    return count
  } catch (err) {
    console.error("[telegram:publishScheduledPosts] Failed querying scheduled posts:", err)
    return 0
  }
}

export async function sendTelegramDirectMessage(
  chatId: string | number,
  text: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  const bot = new Bot(token)
  await bot.api.sendMessage(chatId, text, { parse_mode: "HTML" })
}
