import { Bot } from "grammy"

if (!process.env.TELEGRAM_BOT_TOKEN) {
  try {
    process.loadEnvFile?.(".env")
  } catch {}
  try {
    process.loadEnvFile?.("apps/web/.env.local")
  } catch {}
}

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not set")
  process.exit(1)
}

const apiRoot = process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org"
const bot = new Bot(token, { client: { apiRoot } })

async function main() {
  console.log(`Testing connection to: ${apiRoot}`)
  const start = Date.now()

  try {
    const me = await bot.api.getMe()
    const latency = Date.now() - start
    console.log(`✅ SUCCESS — latency: ${latency}ms`)
    console.log(`Bot: @${me.username} (id: ${me.id})`)
    process.exit(0)
  } catch (err) {
    const latency = Date.now() - start
    console.error(`❌ FAILED — latency: ${latency}ms`)
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
