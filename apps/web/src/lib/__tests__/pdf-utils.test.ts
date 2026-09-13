import { describe, it, expect } from "vitest"
import { toJalali, toJalaliShort } from "../pdf-utils"

describe("T2.8 PDF Utils - Jalali date formatting", () => {
  it("formats 2026-09-13 to Jalali containing 1405", () => {
    const formatted = toJalali(new Date("2026-09-13T12:00:00Z"))
    // In Persian calendar, 2026-09-13 corresponds to 1405/06/22 (شهریور ۱۴۰۵)
    // May be in Farsi digits or Latin digits depending on locale format
    expect(formatted).toMatch(/1405|۱۴۰۵/)
    expect(formatted).toMatch(/شهریور/)
  })

  it("formats 2026-03-20 around Nowruz boundary to Jalali", () => {
    const formatted = toJalali(new Date("2026-03-20T12:00:00Z"))
    // Around Nowruz 2026, it is either 1404 or 1405 (اسفند ۱۴۰۴ or فروردین ۱۴۰۵)
    expect(formatted).toMatch(/1404|۱۴۰۴|1405|۱۴۰۵/)
  })

  it("formats 2026-01-01 to Jalali short format containing 1404", () => {
    const formatted = toJalaliShort(new Date("2026-01-01T12:00:00Z"))
    // 2026-01-01 is in دی ۱۴۰۴
    expect(formatted).toMatch(/1404|۱۴۰۴/)
  })
})
