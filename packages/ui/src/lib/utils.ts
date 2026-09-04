import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format Rial as Toman with fa-IR locale */
export function formatToman(rial: number, locale: "fa" | "en" = "fa"): string {
  const toman = Math.round(rial / 10)
  return toman.toLocaleString(locale === "fa" ? "fa-IR" : "en-US") + (locale === "fa" ? " تومان" : " Toman")
}

/** Convert Western digits to Eastern Arabic (Persian) */
export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!)
}
