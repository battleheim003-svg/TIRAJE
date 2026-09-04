import { formatToman } from "../lib/utils"

interface PriceDisplayProps {
  rial: number
  locale?: "fa" | "en"
  size?: "sm" | "md" | "lg" | "xl"
  compareRial?: number
  className?: string
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
}

export function PriceDisplay({
  rial,
  locale = "fa",
  size = "md",
  compareRial,
  className,
}: PriceDisplayProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className={`text-[var(--color-text)] ${sizeMap[size]} font-variant-numeric tabular-nums`}>
        {formatToman(rial, locale)}
      </span>
      {compareRial != null && compareRial > rial && (
        <span className="text-sm text-[var(--color-text-muted)] line-through font-variant-numeric tabular-nums">
          {formatToman(compareRial, locale)}
        </span>
      )}
    </span>
  )
}
