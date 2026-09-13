/**
 * grammy webhook handler with Redis state machine for support tickets & price flow.
 * Mount at POST /api/telegram
 */
import { Bot, InlineKeyboard, webhookCallback } from "grammy"
import { createClient } from "redis"
import { db } from "@tirajeh/database"
import { escapeHtml } from "@tirajeh/shared"
import { notifyNewContact } from "./service"
import {
  startPriceFlow,
  getPriceFlowState,
  savePriceFlowState,
  clearPriceFlowState,
  sendProductSelectionPage,
  askNextPrice,
  showPricePreview,
  buildPricePostText,
  getActiveProducts,
} from "./price-flow"
import { publishDailyPrice } from "./daily-price-service"

const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT_ISSUE: "🔐 مشکل ورود / حساب کاربری",
  PRICE_INQUIRY: "💰 استعلام قیمت و موجودی",
  ORDER_ISSUE: "📦 پیگیری سفارش",
  PRODUCT_INQUIRY: "🧱 سوال درباره مشخصات محصول",
  TECHNICAL_ISSUE: "⚙️ مشکل فنی در وبسایت",
  OTHER: "❓ سایر موارد",
}

function getRedis() {
  const url = process.env.REDIS_URL
  if (!url) return null
  return createClient({ url })
}

const memoryPending = new Map<number | string, { category: string; expiresAt: number }>()

async function setPendingCategory(chatId: number | string, category: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    memoryPending.set(chatId, { category, expiresAt: Date.now() + 600_000 })
    return
  }
  try {
    await redis.connect()
    await redis.set(`tg:ticket_pending:${chatId}`, category, { EX: 600 })
    await redis.disconnect()
  } catch (err) {
    console.warn("[telegram:redis] Failed to set in Redis, falling back to memory:", err)
    memoryPending.set(chatId, { category, expiresAt: Date.now() + 600_000 })
  }
}

async function getAndClearPendingCategory(chatId: number | string): Promise<string | null> {
  const redis = getRedis()
  if (!redis) {
    const item = memoryPending.get(chatId)
    if (item && item.expiresAt > Date.now()) {
      memoryPending.delete(chatId)
      return item.category
    }
    memoryPending.delete(chatId)
    return null
  }
  try {
    await redis.connect()
    const val = await redis.get(`tg:ticket_pending:${chatId}`)
    if (val) {
      await redis.del(`tg:ticket_pending:${chatId}`)
    }
    await redis.disconnect()
    return val
  } catch (err) {
    console.warn("[telegram:redis] Failed to get from Redis, checking memory:", err)
    const item = memoryPending.get(chatId)
    if (item && item.expiresAt > Date.now()) {
      memoryPending.delete(chatId)
      return item.category
    }
    return null
  }
}

function buildCategoryKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    kb.text(label, `ticket_cat:${key}`).row()
  }
  return kb
}

export function createSupportBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN env var is required")
  const bot = new Bot(token)
  registerCommands(bot)
  return bot
}

function registerCommands(bot: Bot): void {
  // Set bot command suggestions menu
  bot.api
    .setMyCommands([
      { command: "start", description: "شروع و منوی اصلی" },
      { command: "support", description: "ثبت تیکت پشتیبانی" },
      { command: "orders", description: "مشاهده سفارش‌ها" },
      { command: "price", description: "اعلام و انتشار لیست قیمت روز (ادمین)" },
    ])
    .catch((err) => console.warn("[telegram:setMyCommands] warning:", err))

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "سلام! به سامانه رسمی <b>تیراژه</b> خوش آمدید.\n\n" +
        "برای ارسال پیام و ثبت درخواست پشتیبانی، لطفاً دسته‌بندی موضوع خود را انتخاب نمایید:",
      {
        parse_mode: "HTML",
        reply_markup: buildCategoryKeyboard(),
      }
    )
  })

  bot.command("support", async (ctx) => {
    await ctx.reply("لطفاً دسته‌بندی موضوع تیکت خود را انتخاب کنید:", {
      parse_mode: "HTML",
      reply_markup: buildCategoryKeyboard(),
    })
  })

  bot.command("orders", async (ctx) => {
    const siteUrl = (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
    await ctx.reply(
      `برای مشاهده و پیگیری سفارشات به حساب کاربری خود مراجعه کنید:\n${siteUrl}/account/orders`
    )
  })

  bot.command("price", async (ctx) => {
    const adminUserId = process.env.TELEGRAM_ADMIN_USER_ID
    const senderId = String(ctx.from?.id ?? "")
    if (!adminUserId || senderId !== adminUserId) {
      await ctx.reply("⛔ دسترسی مجاز نیست.")
      return
    }
    await startPriceFlow(ctx)
  })

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data
    const chatId = ctx.chat?.id
    if (!chatId) return

    // ── Support ticket categories ──
    if (data.startsWith("ticket_cat:")) {
      const category = data.replace("ticket_cat:", "")
      await setPendingCategory(chatId, category)
      await ctx.answerCallbackQuery().catch(() => {})
      const label = CATEGORY_LABELS[category] ?? category
      await ctx.reply(
        `دسته‌بندی انتخابی شما: <b>${label}</b>\n\n` +
          "لطفاً شرح درخواست یا مشکل خود را به صورت یک پیام متنی بنویسید تا برای تیم پشتیبانی ارسال شود:",
        { parse_mode: "HTML" }
      )
      return
    }

    // ── Price Flow Callbacks ──
    if (
      data.startsWith("price_") ||
      data === "noop"
    ) {
      if (data === "noop") {
        await ctx.answerCallbackQuery().catch(() => {})
        return
      }

      // Admin verification for price callbacks
      const adminUserId = process.env.TELEGRAM_ADMIN_USER_ID
      const senderId = String(ctx.from?.id ?? "")
      if (!adminUserId || senderId !== adminUserId) {
        await ctx.answerCallbackQuery({ text: "⛔ دسترسی مجاز نیست", show_alert: true }).catch(() => {})
        return
      }

      const state = await getPriceFlowState(chatId)
      if (!state) {
        await ctx.answerCallbackQuery({ text: "جلسه منقضی شده است. لطفا دوباره /price را ارسال کنید.", show_alert: true }).catch(() => {})
        return
      }

      const products = await getActiveProducts()

      if (data.startsWith("price_toggle:")) {
        const prodId = data.replace("price_toggle:", "")
        if (state.selected.includes(prodId)) {
          state.selected = state.selected.filter((id) => id !== prodId)
        } else {
          state.selected.push(prodId)
        }
        await savePriceFlowState(chatId, state)
        await ctx.answerCallbackQuery().catch(() => {})
        await sendProductSelectionPage(ctx, state, products, true)
        return
      }

      if (data.startsWith("price_page:")) {
        const pageNum = parseInt(data.replace("price_page:", ""), 10)
        if (!isNaN(pageNum)) {
          state.page = pageNum
          await savePriceFlowState(chatId, state)
          await ctx.answerCallbackQuery().catch(() => {})
          await sendProductSelectionPage(ctx, state, products, true)
        }
        return
      }

      if (data === "price_new_product") {
        state.step = "ADDING_NEW_PRODUCT_NAME"
        await savePriceFlowState(chatId, state)
        await ctx.answerCallbackQuery().catch(() => {})
        await ctx.reply("نام محصول جدید را به فارسی وارد کنید:")
        return
      }

      if (data === "price_confirm_select") {
        if (state.selected.length === 0 && state.newProducts.length === 0) {
          await ctx.answerCallbackQuery({ text: "لطفاً حداقل یک محصول را انتخاب کنید.", show_alert: true }).catch(() => {})
          return
        }

        if (state.selected.length > 0) {
          state.step = "PRICING"
          state.currentIdx = 0
          await savePriceFlowState(chatId, state)
          await ctx.answerCallbackQuery().catch(() => {})
          await askNextPrice(ctx, state, products)
        } else {
          state.step = "PREVIEW"
          await savePriceFlowState(chatId, state)
          await ctx.answerCallbackQuery().catch(() => {})
          await showPricePreview(ctx, state, products)
        }
        return
      }

      if (data === "price_edit") {
        state.step = "SELECTING"
        state.currentIdx = 0
        await savePriceFlowState(chatId, state)
        await ctx.answerCallbackQuery().catch(() => {})
        await sendProductSelectionPage(ctx, state, products, false)
        return
      }

      if (data === "price_cancel") {
        await clearPriceFlowState(chatId)
        await ctx.answerCallbackQuery().catch(() => {})
        await ctx.reply("❌ عملیات اعلام قیمت لغو شد.")
        return
      }

      if (data === "price_send") {
        await ctx.answerCallbackQuery({ text: "در حال انتشار و ثبت تغییرات..." }).catch(() => {})

        try {
          // Find admin user ID from database (optional)
          let adminUserId: string | undefined
          const adminTgId = process.env.TELEGRAM_ADMIN_USER_ID
          if (adminTgId) {
            const adminUser = await db.user.findFirst({
              where: { phone: adminTgId },
              select: { id: true },
            }).catch(() => null)
            if (adminUser) adminUserId = adminUser.id
          }

          const items = state.selected.map((prodId) => ({
            productId: prodId,
            price: state.prices[prodId] ?? 0,
          }))

          const customItems = state.newProducts.map((np) => ({
            name: np.name,
            price: np.price,
          }))

          const result = await publishDailyPrice({
            items,
            customItems: customItems.length > 0 ? customItems : undefined,
            source: "TELEGRAM",
            publishedBy: adminUserId,
          })

          await clearPriceFlowState(chatId)

          if (result.telegramSent) {
            await ctx.reply("✅ لیست قیمت با موفقیت در کانال منتشر شد و قیمت‌ها در سایت به‌روزرسانی شدند.")
          } else if (result.error) {
            await ctx.reply(`⚠️ قیمت‌ها در سایت ثبت شدند ولی ارسال به کانال تلگرام خطا داد:\n${result.error}`)
          } else {
            await ctx.reply("✅ قیمت‌ها در سایت ثبت شدند. (کانال تلگرام پیکربندی نشده)")
          }
        } catch (err: any) {
          console.error("[telegram:priceFlow] publishDailyPrice failed:", err)
          await ctx.reply(`❌ خطا: ${err?.message || err}`)
        }
        return
      }
    }
  })

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat.id

    // ── Check Price Flow State ──
    const priceState = await getPriceFlowState(chatId)
    if (priceState) {
      const text = ctx.message.text.trim()

      if (priceState.step === "ADDING_NEW_PRODUCT_NAME") {
        if (!text) {
          await ctx.reply("لطفاً یک نام معتبر برای محصول وارد کنید:")
          return
        }
        priceState.pendingNewProductName = text
        priceState.step = "ADDING_NEW_PRODUCT_PRICE"
        await savePriceFlowState(chatId, priceState)
        await ctx.reply(`قیمت محصول «${text}» را به تومان وارد کنید:`)
        return
      }

      if (priceState.step === "ADDING_NEW_PRODUCT_PRICE") {
        const cleanNumber = text.replace(/[\s,\u066C\u0660-\u0669\u06F0-\u06F9]/g, (m) => {
          if (m === "," || m === " " || m === "\u066C") return ""
          const code = m.charCodeAt(0)
          if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660)
          if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0)
          return m
        })
        const parsedPrice = parseFloat(cleanNumber)

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          await ctx.reply("❌ مقدار نامعتبر است. لطفاً قیمت را فقط به صورت عدد (تومان) وارد کنید:")
          return
        }

        priceState.newProducts.push({
          name: priceState.pendingNewProductName || "محصول جدید",
          price: parsedPrice,
        })
        delete priceState.pendingNewProductName
        priceState.step = "SELECTING"
        await savePriceFlowState(chatId, priceState)

        const products = await getActiveProducts()
        await ctx.reply(`✅ محصول جدید با قیمت ${Math.round(parsedPrice).toLocaleString("fa-IR")} تومان افزوده شد.`)
        await sendProductSelectionPage(ctx, priceState, products, false)
        return
      }

      if (priceState.step === "PRICING") {
        const cleanNumber = text.replace(/[\s,\u066C\u0660-\u0669\u06F0-\u06F9]/g, (m) => {
          if (m === "," || m === " " || m === "\u066C") return ""
          const code = m.charCodeAt(0)
          if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660)
          if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0)
          return m
        })
        const parsedPrice = parseFloat(cleanNumber)

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          await ctx.reply("❌ لطفاً قیمت معتبر را به صورت عدد به تومان وارد کنید (مثال: 950000):")
          return
        }

        const currentProdId = priceState.selected[priceState.currentIdx]
        priceState.prices[currentProdId] = parsedPrice
        priceState.currentIdx++

        const products = await getActiveProducts()

        if (priceState.currentIdx < priceState.selected.length) {
          await savePriceFlowState(chatId, priceState)
          await askNextPrice(ctx, priceState, products)
        } else {
          priceState.step = "PREVIEW"
          await savePriceFlowState(chatId, priceState)
          await showPricePreview(ctx, priceState, products)
        }
        return
      }
    }

    // ── Check Support Ticket State ──
    const pendingCategory = await getAndClearPendingCategory(chatId)

    if (pendingCategory) {
      const categoryName = CATEGORY_LABELS[pendingCategory] ?? pendingCategory
      const fullName =
        [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || "کاربر تلگرام"

      try {
        const contact = await db.contact.create({
          data: {
            name: fullName,
            subject: categoryName,
            message: ctx.message.text,
            category: pendingCategory as any,
            source: "TELEGRAM",
            telegramChatId: String(chatId),
            telegramUserId: String(ctx.from?.id ?? ""),
            telegramUsername: ctx.from?.username ?? null,
            status: "UNREAD",
          },
        })

        const shortId = contact.id.split("-")[0]?.toUpperCase() ?? contact.id

        await ctx.reply(
          `✅ تیکت پشتیبانی شما با شناسه پیگیری <code>#${shortId}</code> با موفقیت ثبت شد.\n\n` +
            "تیم پشتیبانی تیراژه درخواست شما را بررسی کرده و پاسخ را مستقیماً از طریق همین ربات برای شما ارسال خواهد کرد.",
          { parse_mode: "HTML" }
        )

        // Notify Admin
        void notifyNewContact({
          name: fullName,
          email: ctx.from?.username ? `@${ctx.from.username}` : null,
          phone: null,
          subject: categoryName,
          message: ctx.message.text,
          category: categoryName,
          source: "TELEGRAM",
        }).catch((err) => console.error("[telegram:notifyAdmin] Error:", err))

        // Forum Topics support (optional feature behind flag)
        if (
          process.env.SUPPORT_USE_FORUM_TOPICS === "true" &&
          process.env.TELEGRAM_SUPPORT_CHAT_ID
        ) {
          try {
            const supportChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID
            const userHandle = ctx.from?.username ? `@${escapeHtml(ctx.from.username)}` : escapeHtml(ctx.from?.id)
            await ctx.api.sendMessage(
              supportChatId,
              `🎫 <b>تیکت جدید [#${escapeHtml(shortId)}]</b>\n` +
                `کاربر: ${escapeHtml(fullName)} (${userHandle})\n` +
                `دسته: ${escapeHtml(categoryName)}\n\n` +
                `<b>پیام:</b>\n${escapeHtml(ctx.message.text)}`,
              { parse_mode: "HTML" }
            )
          } catch (forumErr) {
            console.warn("[telegram:forumTopics] Could not post to support chat:", forumErr)
          }
        }
      } catch (dbErr) {
        console.error("[telegram:createContact] Error inserting contact:", dbErr)
        await ctx.reply("متأسفانه در ثبت تیکت خطایی رخ داد. لطفاً دوباره تلاش کنید.")
      }
      return
    }

    // Default response when no ticket or flow pending
    await ctx.reply(
      "سلام! برای ثبت تیکت یا درخواست پشتیبانی، لطفاً از دستور /support استفاده کنید.",
      { parse_mode: "HTML" }
    )
  })
}

let _handler: ((req: Request) => Promise<Response>) | null = null

export function POST(req: Request): Promise<Response> {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error("TELEGRAM_WEBHOOK_SECRET not configured")
    return Promise.resolve(
      new Response(JSON.stringify({ error: "TELEGRAM_WEBHOOK_SECRET not configured" }), { status: 503 })
    )
  }
  if (!_handler) {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    const bot = createSupportBot()
    _handler = webhookCallback(bot, "std/http", {
      secretToken: secret,
    }) as unknown as (req: Request) => Promise<Response>
  }
  return _handler(req)
}
