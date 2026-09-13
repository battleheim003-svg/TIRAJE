import { NextResponse } from "next/server"
import { drainOutbox } from "@tirajeh/integrations"
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/cron-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  if (!verifyCronSecret(req)) {
    return cronUnauthorizedResponse()
  }

  try {
    const result = await drainOutbox(25)
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    console.error("[cron:outbox] Error draining outbox:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
