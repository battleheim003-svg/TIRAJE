import { formatToman } from "../lib/utils"
import styles from "./PriceDisplay.module.css"

interface PriceDisplayProps {
  rial: number
  locale?: "fa" | "en"
  size?: "sm" | "md" | "lg" | "xl"
  compareRial?: number
  className?: string
}

const sizeClassMap = {
  sm: styles["ui-price--sm"],
  md: styles["ui-price--md"],
  lg: styles["ui-price--lg"],
  xl: styles["ui-price--xl"],
}

export function PriceDisplay({
  rial,
  locale = "fa",
  size = "md",
  compareRial,
  className,
}: PriceDisplayProps) {
  return (
    <span className={[styles["ui-price__wrap"], className].filter(Boolean).join(" ")}>
      <span className={`${styles["ui-price__main"]} ${sizeClassMap[size]}`}>
        {formatToman(rial, locale)}
      </span>
      {compareRial != null && compareRial > rial && (
        <span className={styles["ui-price__compare"]}>
          {formatToman(compareRial, locale)}
        </span>
      )}
    </span>
  )
}
