/** Inline replacements for @tirajeh/ui utilities — no external deps */

/** Format Rial as Toman */
export function formatToman(rial: number, locale: "fa" | "en" = "fa"): string {
  const toman = Math.round(rial / 10)
  return (
    toman.toLocaleString(locale === "fa" ? "fa-IR" : "en-US") +
    (locale === "fa" ? " تومان" : " Toman")
  )
}
