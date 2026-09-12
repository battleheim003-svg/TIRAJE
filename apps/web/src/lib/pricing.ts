import type { PackagingTier } from "@tirajeh/database"
import { toToman } from "@tirajeh/shared"

export type ProductWithOptions = {
  price: unknown
  packagingOptions?: Array<{
    tier: PackagingTier
    price: unknown
    bagCount: number
    isActive: boolean
  }>
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
  }
}

/**
 * قیمت واحد (تومان) — تنها مرجع مجاز قیمتگذاری
 * اگر tier داده شده ولی گزینه فعال ندارد → AppError
 */
export function resolveUnitPriceToman(
  product: ProductWithOptions,
  tier: PackagingTier | null
): number {
  if (tier) {
    const option = product.packagingOptions?.find(
      (o) => o.tier === tier && o.isActive
    )
    if (!option)
      throw new AppError("بستهبندی انتخابی موجود نیست", "INVALID_INPUT", 400)
    return Math.round(toToman(option.price) / option.bagCount)
  }
  return toToman(product.price)
}
