/**
 * Telegram notification service.
 *
 * Architecture:
 *  - All outbound messages are pushed onto a Redis list (send queue).
 *  - A separate worker (or Vercel cron / server cron) drains the queue via
 *    grammy's sendMessage API. This decouples the web request from the
 *    Telegram API and survives temporary bot API outages.
 *  - Webhook handler for incoming messages is in apps/web/src/app/api/telegram/route.ts
 */
import { Bot } from "grammy"
import { createClient } from "redis"

const QUEUE_KEY = "tg:send_queue"

// ─── Redis queue helper ───────────────────────────────────────────────────────

function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) throw new Error("REDIS_URL env var is required")
  return createClient({ url })
}

interface QueuedMessage {
  chatId: string | number
  text: string
  parseMode?: "HTML" | "Markdown"
}

/** Push a message onto the send queue (fire-and-forget from action context) */
export async function enqueueTelegramMessage(msg: QueuedMessage): Promise<void> {
  const redis = getRedis()
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
  const toman = Math.round(params.totalAmount / 10).toLocaleString("fa-IR")
  const text = [
    "🛒 <b>سفارش جدید</b>",
    `شماره: <code>${params.orderNumber}</code>`,
    `مشتری: ${params.customerName}`,
    `مبلغ: ${toman} تومان`,
    `اقلام: ${params.itemCount} قلم`,
    `شهر: ${params.city}`,
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
    `نام: ${params.name} (${params.customerType})`,
    `محصول: ${params.productName}`,
    `مقدار: ${params.quantityTon} تن`,
    `تلفن: <code>${params.phone}</code>`,
  ].join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}

export async function notifyPaymentReceived(params: {
  orderNumber: string
  amount: number
  refId: string
}) {
  const toman = Math.round(params.amount / 10).toLocaleString("fa-IR")
  const text = [
    "✅ <b>پرداخت موفق</b>",
    `سفارش: <code>${params.orderNumber}</code>`,
    `مبلغ: ${toman} تومان`,
    `کد پیگیری: <code>${params.refId}</code>`,
  ].join("\n")

  await enqueueTelegramMessage({ chatId: ADMIN_CHAT(), text, parseMode: "HTML" })
}
