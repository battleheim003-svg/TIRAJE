/**
 * Display maps and helpers for cement-domain Prisma enums.
 * Shared across product cards, filters, and detail pages.
 */

export {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  PRICE_UNIT,
} from "@tirajeh/shared"

// ─── Price formatting ──────────────────────────────────────────────────────

export { formatToman } from "@tirajeh/shared"

// ─── Relative time and Jalali formatting ───────────────────────────────────

export { formatRelativeFa, formatJalali } from "@tirajeh/shared"

// ─── Weight display ────────────────────────────────────────────────────────

export function formatWeight(kg: unknown, locale: string): string {
  const num = Number(kg)
  if (isNaN(num)) return "—"
  const formatted = locale === "fa" ? num.toLocaleString("fa-IR") : num.toLocaleString("en-US")
  return `${formatted} kg`
}
