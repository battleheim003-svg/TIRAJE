import { createSupportBot } from "../packages/integrations/src/telegram/webhook.ts"

async function main() {
  console.log("🤖 Starting Tirajeh Support Bot in Polling Mode for local testing...")
  const bot = createSupportBot()

  // Drop webhook so polling can run locally without webhook conflict
  await bot.api.deleteWebhook({ drop_pending_updates: false })

  console.log("✅ Webhook cleared, listening for updates...")

  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 Bot @${botInfo.username} is now ONLINE!`)
      console.log(`👉 Open Telegram, find @${botInfo.username} and send /start or /support to test!`)
    },
  })
}

main().catch((err) => {
  console.error("❌ Failed to start bot:", err)
  process.exit(1)
})
