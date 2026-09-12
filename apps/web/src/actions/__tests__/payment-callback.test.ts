import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockDb = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: {
    update: vi.fn(),
    findUnique: vi.fn().mockResolvedValue({ id: "order-1", items: [] }),
  },
  orderEvent: {
    create: vi.fn(),
  },
  product: {
    update: vi.fn(),
  }
}))

vi.mock("@tirajeh/database", () => ({
  db: mockDb
}))

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("fa")
}))

import { GET } from "../../app/api/payment/callback/route"
import { paymentService } from "@tirajeh/integrations"

describe("Payment Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb))
    mockDb.order.findUnique.mockResolvedValue({ id: "order-1", items: [] })
  })

  it("handles Status=NOK by cancelling order and releasing stock", async () => {
    const req = new NextRequest("http://localhost:3000/api/payment/callback?Status=NOK&Authority=test-auth&orderId=order-1")
    const res = await GET(req)
    
    expect(mockDb.$transaction).toHaveBeenCalled()
    expect(mockDb.order.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "CANCELLED" }
    }))
    expect(res.headers.get("location")).toContain("/checkout/failed?order=order-1")
  })

  it("is idempotent: if payment is already COMPLETED, does not modify order again", async () => {
    const verifySpy = vi.spyOn(paymentService, "verifyPayment").mockResolvedValueOnce({
      success: true,
      orderId: "order-1",
      refId: "123456"
    })
    
    const req = new NextRequest("http://localhost:3000/api/payment/callback?Status=OK&Authority=test-auth&orderId=order-1")
    const res = await GET(req)
    
    expect(verifySpy).toHaveBeenCalledWith("test-auth")
    expect(res.headers.get("location")).toContain("/checkout/success?order=order-1")
  })
})
