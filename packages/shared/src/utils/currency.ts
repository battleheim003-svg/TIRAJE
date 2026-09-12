/**
 * محاسبات مالی و کرایه.
 * همه مبالغ دیتابیس تومان صحیح هستند.
 */

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
