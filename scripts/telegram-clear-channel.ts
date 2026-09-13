import fs from "fs"
import path from "path"
import { Bot } from "grammy"
import { db } from "../packages/database/src/index"

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

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const channelId = process.env.TELEGRAM_CHANNEL_ID

  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required in .env.local")
  if (!channelId) throw new Error("TELEGRAM_CHANNEL_ID is required in .env.local")

  console.log(`🧹 Initializing Telegram Channel Message Cleaner for channel: ${channelId}...`)
  const bot = new Bot(token, {
    client: {
      apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org",
    },
  })

  // Find all sent messages logged in TelegramLog
  const logs = await db.telegramLog.findMany({
    where: {
      channelId: String(channelId),
      telegramMessageId: { not: null },
      status: { in: ["SENT", "UPDATED"] },
    },
    orderBy: { createdAt: "desc" },
  })

  console.log(`📋 Found ${logs.length} logged messages to delete from Telegram channel.`)

  let deletedCount = 0
  let failedCount = 0

  for (const log of logs) {
    if (!log.telegramMessageId) continue

    try {
      await bot.api.deleteMessage(channelId, log.telegramMessageId)
      console.log(`🗑️ Deleted message ${log.telegramMessageId} (${log.entityType}: ${log.entityId})`)
      deletedCount++

      await db.telegramLog.update({
        where: { id: log.id },
        data: { status: "DELETED" },
      })
    } catch (err: any) {
      console.warn(
        `⚠️ Could not delete message ${log.telegramMessageId}:`,
        err?.description || err?.message || err
      )
      failedCount++
    }

    await sleep(1000)
  }

  console.log(
    `\n✅ Telegram Channel Clear finished! Deleted: ${deletedCount}, Skipped/Failed: ${failedCount}`
  )
}

main()
  .catch((err) => {
    console.error("❌ Fatal error in clear script:", err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
