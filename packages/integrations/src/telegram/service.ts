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
import { db } from "@tirajeh/database"
import { formatToman, escapeHtml } from "@tirajeh/shared"
import { buildPostHashtags, buildProductHashtags } from "./hashtags"

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
  return new Bot(token, {
    client: {
      apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
    },
  })
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
  const bot = new Bot(token, {
    client: {
      apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
    },
  })
  await bot.api.sendMessage(chatId, text, { parse_mode: "HTML" })
}
