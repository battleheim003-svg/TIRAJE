import { describe, it, expect } from "vitest"
import { formatToman, tomanToRial } from "@tirajeh/shared"

describe("money utilities — T0.1", () => {
  it("formats zero amount with contact label or default", () => {
    expect(formatToman(0, "fa")).toBe("تماس بگیرید")
    expect(formatToman(0, "en")).toBe("Contact us")
    expect(formatToman(0, "fa", { zeroLabel: "رایگان" })).toBe("رایگان")
  })

  it("formats 870000 in fa and en locales", () => {
    expect(formatToman(870000, "fa")).toBe("۸۷۰٬۰۰۰ تومان")
    expect(formatToman(870000, "en")).toBe("870,000 Toman")
    expect(formatToman(870000, "fa", { unit: false })).toBe("۸۷۰٬۰۰۰")
    expect(formatToman(870000, "en", { unit: false })).toBe("870,000")
  })

  it("converts toman to rial: tomanToRial(870000) === 8700000", () => {
    expect(tomanToRial(870000)).toBe(8700000)
  })
})
