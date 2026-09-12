import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export { formatToman } from "@tirajeh/shared"

/** Convert Western digits to Eastern Arabic (Persian) */
export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!)
}
