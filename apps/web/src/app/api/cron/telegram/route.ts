import { NextResponse } from "next/server"
import { drainTelegramQueue, publishScheduledPosts } from "@tirajeh/integrations"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [drained, publishedCount] = await Promise.all([
      drainTelegramQueue().then(() => "ok").catch((err) => `drain error: ${err}`),
      publishScheduledPosts().catch((err) => {
        console.error("[cron:publishScheduledPosts] error:", err)
        return 0
      }),
    ])

    return NextResponse.json({
      success: true,
      drained,
      publishedScheduledPosts: publishedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    console.error("[cron:telegram] error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
