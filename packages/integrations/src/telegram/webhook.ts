/**
 * grammy webhook handler — mount at POST /api/telegram
 *
 * apps/web/src/app/api/telegram/route.ts:
 *   import { POST } from "@tirajeh/integrations/telegram/webhook"
 *   export { POST }
 */
import { Bot, webhookCallback } from "grammy"
import type { NextRequest } from "next/server"

function buildBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN env var is required")
  return new Bot(token)
}

function registerCommands(bot: Bot): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "سلام! به ربات تیراژه خوش آمدید.\n\nبرای پشتیبانی با ما تماس بگیرید.",
      { parse_mode: "HTML" }
    )
  })

  bot.command("orders", async (ctx) => {
    await ctx.reply(
      "برای مشاهده سفارشات خود به حساب کاربری‌تان مراجعه کنید:\nhttps://tirajeh.ir/account/orders"
    )
  })

  bot.on("message:text", async (ctx) => {
    // Log all incoming messages for support team (future: route to CRM)
    console.log("[telegram:incoming]", {
      from: ctx.from?.id,
      username: ctx.from?.username,
      text: ctx.message.text,
    })
    await ctx.reply("پیام شما دریافت شد. تیم پشتیبانی ما به زودی پاسخ خواهد داد.")
  })
}

let _handler: ((req: NextRequest) => Promise<Response>) | null = null

export function POST(req: NextRequest): Promise<Response> {
  if (!_handler) {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    const bot = buildBot()
    registerCommands(bot)
    _handler = webhookCallback(bot, "std/http", {
      secretToken: secret,
    }) as unknown as (req: NextRequest) => Promise<Response>
  }
  return _handler(req)
}
