/** همه مبالغ دیتابیس تومان صحیح هستند. تبدیل به ریال فقط در لایه درگاه. */
export type Toman = number

export function toToman(value: unknown): Toman {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

export function tomanToRial(amount: Toman): number {
  return Math.round(amount) * 10
}

export function formatToman(
  amount: unknown,
  locale: "fa" | "en" = "fa",
  opts?: { unit?: boolean; zeroLabel?: string }
): string {
  const n = toToman(amount)
  const unit = opts?.unit ?? true
  if (n === 0) return opts?.zeroLabel ?? (locale === "fa" ? "تماس بگیرید" : "Contact us")
  const digits = n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")
  if (!unit) return digits
  return locale === "fa" ? `${digits} تومان` : `${digits} Toman`
}

/** قیمت هر تن از قیمت هر کیسه و وزن کیسه */
export function pricePerTon(unitPriceToman: Toman, unitWeightKg: number): Toman {
  if (!unitWeightKg) return 0
  return Math.round((unitPriceToman / unitWeightKg) * 1000)
}

/** تبدیل اعداد به ارقام فارسی */
export function toFarsiDigits(n: number | string): string {
  const str = String(n)
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return str.replace(/[0-9]/g, (w) => farsiDigits[+w] || w)
}
