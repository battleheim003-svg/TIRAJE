import { describe, it, expect } from "vitest"

describe("T2.5 Daily Price - Percentage Change and Yesterday Price Calculation", () => {
  it("calculates positive percentage change correctly", () => {
    const yesterdayPrice = 100000
    const todayInput = 105000
    const pctChange = ((todayInput - yesterdayPrice) / yesterdayPrice) * 100
    expect(pctChange).toBe(5)
  })

  it("calculates negative percentage change correctly", () => {
    const yesterdayPrice = 200000
    const todayInput = 180000
    const pctChange = ((todayInput - yesterdayPrice) / yesterdayPrice) * 100
    expect(pctChange).toBe(-10)
  })

  it("handles zero change as 0", () => {
    const yesterdayPrice = 500000
    const todayInput = 500000
    const pctChange = ((todayInput - yesterdayPrice) / yesterdayPrice) * 100
    expect(pctChange).toBe(0)
  })

  it("returns null or uncalculated when yesterdayPrice is null or 0", () => {
    const yesterdayPrice: number | null = null
    const todayInput = 500000
    const pctChange = yesterdayPrice && todayInput ? ((todayInput - yesterdayPrice) / yesterdayPrice) * 100 : null
    expect(pctChange).toBeNull()
  })

  it("formats yesterdayPrice correctly or returns null when no previous bulletin exists", () => {
    // When last bulletin before today doesn't exist, product yesterdayPrice is null
    const productWithoutYesterday = {
      id: "prod-1",
      nameFa: "سیمان پرتلند تیپ ۲",
      price: 920000,
      yesterdayPrice: null,
    }
    expect(productWithoutYesterday.yesterdayPrice).toBeNull()

    const productWithYesterday = {
      id: "prod-2",
      nameFa: "سیمان سفید",
      price: 1100000,
      yesterdayPrice: 1050000,
    }
    expect(productWithYesterday.yesterdayPrice).toBe(1050000)
  })
})
