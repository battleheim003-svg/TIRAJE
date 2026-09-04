/**
 * Format Iranian Rial amounts.
 * The database stores prices in Rial (integer).
 * Display: "۱۲۵،۰۰۰ تومان" (Toman = Rial / 10) or raw Rial.
 */

const rialFormatter = new Intl.NumberFormat("fa-IR", {
  style: "decimal",
  maximumFractionDigits: 0,
})

const enFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 0,
})

/** Format as Toman (÷10) with Persian numerals — primary display currency */
export function formatToman(rial: number | bigint, locale: "fa" | "en" = "fa"): string {
  const toman = Number(rial) / 10
  const formatted = locale === "fa" ? rialFormatter.format(toman) : enFormatter.format(toman)
  return locale === "fa" ? `${formatted} تومان` : `${formatted} Toman`
}

/** Format raw Rial with Persian numerals */
export function formatRial(rial: number | bigint, locale: "fa" | "en" = "fa"): string {
  const formatted = locale === "fa" ? rialFormatter.format(Number(rial)) : enFormatter.format(Number(rial))
  return locale === "fa" ? `${formatted} ریال` : `${formatted} Rial`
}

/** Convert Prisma Decimal (string) → number safely */
export function decimalToNumber(value: string | number | { toNumber(): number }): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return parseFloat(value)
  return value.toNumber()
}

/** Freight cost formula: baseCost + (costPerTon × totalWeightTons) */
export function calculateFreight(
  baseCost: number,
  costPerTon: number,
  totalWeightTons: number
): number {
  return Math.round(baseCost + costPerTon * totalWeightTons)
}
