import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format Toman with locale */
export function formatToman(
  amount: unknown,
  locale: "fa" | "en" = "fa",
  opts?: { unit?: boolean; zeroLabel?: string }
): string {
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n) || n === 0) return opts?.zeroLabel ?? (locale === "fa" ? "تماس بگیرید" : "Contact us")
  const digits = Math.round(n).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")
  if (opts?.unit === false) return digits
  return locale === "fa" ? `${digits} تومان` : `${digits} Toman`
}

/** Convert Western digits to Eastern Arabic (Persian) */
export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!)
}
