import type { PaymentGatewayAdapter, PaymentInitResult, PaymentVerifyResult } from "./types"
import { AppError, PaymentError } from "@tirajeh/shared"

const SANDBOX_BASE = "https://sandbox.zarinpal.com/pg/v4/payment"
const LIVE_BASE = "https://api.zarinpal.com/pg/v4/payment"
const SANDBOX_REDIRECT = "https://sandbox.zarinpal.com/pg/StartPay"
const LIVE_REDIRECT = "https://www.zarinpal.com/pg/StartPay"

interface ZarinpalConfig {
  merchantId: string
  sandbox?: boolean
}

export class ZarinpalAdapter implements PaymentGatewayAdapter {
  readonly name = "ZARINPAL"
  private readonly base: string
  private readonly redirectBase: string
  private readonly merchantId: string

  constructor(config: ZarinpalConfig) {
    this.merchantId = config.merchantId
    this.base = config.sandbox ? SANDBOX_BASE : LIVE_BASE
    this.redirectBase = config.sandbox ? SANDBOX_REDIRECT : LIVE_REDIRECT
  }

  async init(params: {
    amount: number
    description: string
    callbackUrl: string
    mobile?: string
    email?: string
    orderId: string
  }): Promise<PaymentInitResult> {
    const body = {
      merchant_id: this.merchantId,
      amount: params.amount,
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: {
        mobile: params.mobile,
        email: params.email,
        order_id: params.orderId,
      },
    }

    const res = await fetch(`${this.base}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as {
      data: { code: number; authority: string } | null
      errors: { code: number; message: string } | null
    }

    if (!json.data || json.data.code !== 100) {
      // Log internal code server-side; never surface it to the user
      const errCode = json.errors?.code ?? json.data?.code ?? 0
      console.error("[zarinpal:init] gateway refused — code", errCode)
      throw new PaymentError()
    }

    return {
      authority: json.data.authority,
      redirectUrl: `${this.redirectBase}/${json.data.authority}`,
      rawResponse: json,
    }
  }

  async verify(params: {
    authority: string
    amount: number
  }): Promise<PaymentVerifyResult> {
    const body = {
      merchant_id: this.merchantId,
      amount: params.amount,
      authority: params.authority,
    }

    const res = await fetch(`${this.base}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as {
      data: {
        code: number
        ref_id: string
        card_pan: string
        amount: number
      } | null
      errors: { code: number } | null
    }

    // Code 100 = success, 101 = already verified (idempotent)
    const success =
      json.data !== null && (json.data.code === 100 || json.data.code === 101)

    return {
      success,
      refId: json.data?.ref_id ?? null,
      cardPan: json.data?.card_pan ?? null,
      amount: json.data?.amount ?? 0,
      rawResponse: json,
    }
  }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _zarinpal: ZarinpalAdapter | null = null

export function getZarinpalAdapter(): ZarinpalAdapter {
  if (!_zarinpal) {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID
    if (!merchantId) throw new Error("ZARINPAL_MERCHANT_ID env var is required")
    _zarinpal = new ZarinpalAdapter({
      merchantId,
      sandbox: process.env.ZARINPAL_SANDBOX === "true",
    })
  }
  return _zarinpal
}
