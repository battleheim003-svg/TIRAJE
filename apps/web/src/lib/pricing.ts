import type { Product, ProductPackagingOption } from "@tirajeh/database"
import { PackagingTier } from "@tirajeh/database"
import { AppError, toToman } from "@tirajeh/shared"

export type ProductWithOptions = Pick<Product, "price"> & {
  packagingOptions: Pick<
    ProductPackagingOption,
    "tier" | "price" | "bagCount" | "isActive"
  >[]
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
