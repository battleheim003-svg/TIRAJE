import { NextResponse } from "next/server"
import { publishScheduledPosts } from "@tirajeh/integrations"
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/cron-guard"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  if (!verifyCronSecret(request)) {
    return cronUnauthorizedResponse()
  }

  try {
    const publishedCount = await publishScheduledPosts().catch((err) => {
      console.error("[cron:publishScheduledPosts] error:", err)
      return 0
    })

    return NextResponse.json({
      success: true,
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
