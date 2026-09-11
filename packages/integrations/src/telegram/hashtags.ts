/**
 * Telegram hashtag generator and normalizer for Tirajeh posts & products.
 */

/** نرمال‌سازی یک برچسب فارسی/انگلیسی به هشتگ معتبر تلگرام (بدون فاصله، بدون خط‌تیره) */
export function toHashtag(label: string): string {
  const cleaned = label
    .trim()
    .replace(/[\s\u200c\-–—]+/g, "_") // فاصله، نیم‌فاصله، خط‌تیره → آندرلاین
    .replace(/[^\p{L}\p{N}_]/gu, "")   // حذف هر کاراکتر غیرمجاز
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

  return cleaned ? `#${cleaned}` : ""
}

export function buildPostHashtags(params: { categoryFa?: string | null; tagFa: string[] }): string[] {
  const tags = ["#وبلاگ", "#تیراژه"]
  if (params.categoryFa) {
    const h = toHashtag(params.categoryFa)
    if (h) tags.push(h)
  }
  for (const t of params.tagFa.slice(0, 4)) {
    const h = toHashtag(t)
    if (h) tags.push(h)
  }
  return [...new Set(tags)]
}

export function buildProductHashtags(params: {
  categoriesFa: string[]
  brandFa?: string | null
  cementTypeLabelFa?: string | null
  packagingLabelFa?: string | null
}): string[] {
  const tags = ["#محصولات", "#تیراژه"]
  for (const c of params.categoriesFa.slice(0, 2)) {
    const h = toHashtag(c)
    if (h) tags.push(h)
  }
  if (params.brandFa) {
    const h = toHashtag(params.brandFa)
    if (h) tags.push(h)
  }
  if (params.cementTypeLabelFa) {
    const h = toHashtag(params.cementTypeLabelFa)
    if (h) tags.push(h)
  }
  if (params.packagingLabelFa) {
    const h = toHashtag(params.packagingLabelFa)
    if (h) tags.push(h)
  }
  return [...new Set(tags)]
}
