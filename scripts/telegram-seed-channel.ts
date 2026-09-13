import fs from "fs"
import path from "path"
import { Bot, InlineKeyboard } from "grammy"
import { db } from "../packages/database/src/index"
import { buildProductHashtags } from "../packages/integrations/src/telegram/hashtags"

// Load environment variables from apps/web/.env.local and packages/database/.env
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), "apps/web/.env.local"),
    path.resolve(process.cwd(), "packages/database/.env"),
    path.resolve(process.cwd(), ".env"),
  ]

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

loadEnv()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function formatPrice(price: number | string | any): string {
  const num = typeof price === "number" ? price : parseFloat(String(price))
  if (isNaN(num) || num <= 0) return "استعلام"
  return Math.round(num).toLocaleString("fa-IR")
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID
  const siteUrl = (process.env.SITE_URL || "https://tirajeconcrete.com").replace(/\/+$/, "")
  const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || "@tirajeconcrete"

  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required in .env.local")
  if (!channelId) throw new Error("TELEGRAM_CHANNEL_ID is required in .env.local")

  console.log(`🚀 Initializing Telegram Channel Seeder for channel: ${channelId}...`)
  const bot = new Bot(token, {
    client: {
      apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
    },
  })

  // 1. Fetch all active products with brand, category, and primary image
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      brand: true,
      images: { where: { isPrimary: true }, take: 1 },
      productCategories: {
        include: { category: true },
      },
    },
    orderBy: [{ brand: { sortOrder: "asc" } }, { createdAt: "asc" }],
  })

  console.log(`📦 Found ${products.length} active products to process.`)

  let successCount = 0
  let skippedCount = 0

  // 2. Loop through products and send individual photo post
  for (const product of products) {
    const primaryImg = product.images[0]?.url
    if (!primaryImg) {
      console.log(`⏩ Skipping "${product.nameFa}" (No primary image found)`)
      skippedCount++
      continue
    }

    const categoriesFa = product.productCategories
      .map((pc) => pc.category.nameFa)
      .filter(Boolean)

    const hashtags = buildProductHashtags({
      categoriesFa,
      brandFa: product.brand?.nameFa ?? null,
      cementTypeLabelFa: product.cementType ?? null,
    })

    const priceNum = Number(product.price)
    const priceText = priceNum > 0 ? `${formatPrice(priceNum)} تومان` : "استعلام تماس"

    let packLabel = ""
    if (product.packagingType === "BAG_50KG") packLabel = "کیسه ۵۰ کیلوگرمی"
    else if (product.packagingType === "JUMBO_1500KG") packLabel = "جامبوبگ ۱۵۰۰ کیلوگرمی"
    else if (product.packagingType === "BULK") packLabel = "فله"

    const captionLines: string[] = [
      `🧱 <b>${product.nameFa}</b>`,
      "",
      product.descriptionFa ? product.descriptionFa : "",
      "",
      `💰 قیمت: <b>${priceText}</b>`,
      packLabel ? `📦 نوع بسته‌بندی: ${packLabel}` : "",
      product.brand?.nameFa ? `🏭 برند: ${product.brand.nameFa}` : "",
      "",
      hashtags.join(" "),
      "",
      channelUsername,
    ].filter((line) => line !== undefined)

    let caption = captionLines.join("\n").trim()
    if (caption.length > 1024) {
      caption = caption.slice(0, 1020) + "…"
    }

    const productUrl = `${siteUrl}/fa/products/${product.slug}`
    const keyboard = new InlineKeyboard().url("🛒 مشاهده و خرید", productUrl)

    try {
      console.log(`📤 Sending product: ${product.nameFa}...`)
      let sentMsg: { message_id: number }

      try {
        sentMsg = await bot.api.sendPhoto(channelId, primaryImg, {
          caption,
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
      } catch (photoErr) {
        console.warn(`⚠️ sendPhoto failed for ${product.nameFa}, falling back to sendMessage:`, photoErr)
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

      console.log(`✅ Sent! (Message ID: ${sentMsg.message_id})`)
      successCount++
    } catch (err: any) {
      console.error(
        `❌ Error sending product "${product.nameFa}":`,
        err?.description || err?.message || err
      )

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

    // Rate limit sleep (2000ms between telegram posts)
    await sleep(2000)
  }

  console.log(`\n🎉 Products loop completed! Sent: ${successCount}, Skipped: ${skippedCount}`)

  // 3. Final summary price list post
  console.log("\n📊 Generating and publishing final price list post...")

  const todayShamsi = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "full",
    timeZone: "Asia/Tehran",
  }).format(new Date())

  const priceItems = products.map((p, i) => {
    const pr = Number(p.price)
    const prStr = pr > 0 ? `${formatPrice(pr)} تومان` : "استعلام"
    return `${(i + 1).toLocaleString("fa-IR")}. <b>${p.nameFa}</b> — ${prStr}`
  })

  const summaryHeader = [
    "📋 <b>لیست کامل قیمت محصولات تیراژه صنعت خاک</b>",
    `📅 آخرین بروزرسانی: ${todayShamsi}`,
    "━━━━━━━━━━━━━━━━━━━━━",
    "",
  ].join("\n")

  const summaryFooter = [
    "",
    "━━━━━━━━━━━━━━━━━━━━━",
    "⚡️ برای استعلام قیمت و سفارش به سایت مراجعه کنید:",
    `🌐 ${siteUrl}`,
    "",
    "#لیست_قیمت #مصالح_ساختمانی #تیراژه #قیمت_روز",
    "",
    channelUsername,
  ].join("\n")

  // Check 4096 character limit and split if needed
  const chunks: string[] = []
  let currentChunk = summaryHeader

  for (const item of priceItems) {
    if ((currentChunk + "\n" + item + summaryFooter).length > 3900) {
      chunks.push(currentChunk)
      currentChunk = summaryHeader + item
    } else {
      currentChunk += (currentChunk === summaryHeader ? "" : "\n") + item
    }
  }
  chunks.push(currentChunk + summaryFooter)

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunkText = chunks[idx]
    try {
      console.log(`📤 Sending price summary part ${idx + 1} of ${chunks.length}...`)
      await bot.api.sendMessage(channelId, chunkText, {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().url("🛒 ورود به فروشگاه آنلاین", `${siteUrl}/fa/products`),
      })
      console.log(`✅ Summary part ${idx + 1} published successfully!`)
    } catch (err: any) {
      console.error(`❌ Error sending price summary:`, err?.description || err?.message || err)
    }
    if (idx < chunks.length - 1) await sleep(2000)
  }

  console.log("\n==========================================")
  console.log("✨ ALL TELEGRAM CHANNEL SEEDING TASKS FINISHED!")
  console.log("==========================================")
}

main()
  .catch((err) => {
    console.error("❌ Fatal error during channel seed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
