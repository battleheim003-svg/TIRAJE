// ─── Payment Adapter Pattern ──────────────────────────────────────────────────
// All gateways implement PaymentGateway interface.
// Adding IDPay = implement the interface + register in factory.
// Web checkout action only calls the interface — zero changes needed there.

export interface PaymentInitResult {
  authority: string      // gateway's token / reference
  redirectUrl: string    // URL to send the user to for payment
  rawResponse: unknown   // full gateway response stored in DB
}

export interface PaymentVerifyResult {
  success: boolean
  refId: string | null   // gateway's settlement reference ID
  cardPan: string | null // masked card number shown on receipt
  amount: number         // amount confirmed by gateway (in Rial)
  rawResponse: unknown
}

export interface PaymentGatewayAdapter {
  readonly name: string
  init(params: {
    amount: number       // Rial
    description: string
    callbackUrl: string
    mobile?: string
    email?: string
    orderId: string
  }): Promise<PaymentInitResult>

  verify(params: {
    authority: string
    amount: number
  }): Promise<PaymentVerifyResult>
}
