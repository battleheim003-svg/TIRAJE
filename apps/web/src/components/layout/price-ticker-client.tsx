"use client"

import Link from "next/link"
import { TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react"
import styles from "./PriceTicker.module.css"

export interface TickerItem {
  id: string
  name: string
  nameEn: string
  price: number
  previousPrice: number | null
  slug: string | null
  packaging: string | null
}

interface PriceTickerClientProps {
  items: TickerItem[]
  date: string
  locale: string
}

function formatToman(num: number): string {
  return num.toLocaleString("fa-IR")
}

export function PriceTickerClient({ items, date, locale }: PriceTickerClientProps) {
  const fa = locale === "fa"
  const isScrollable = items.length > 4

  // If scrollable, duplicate items to create a seamless infinite loop
  const displayItems = isScrollable ? [...items, ...items] : items
  const animationDuration = `${Math.max(20, items.length * 4)}s`

  return (
    <aside
      className={styles["web-ticker"]}
      aria-label={fa ? "اعلام قیمت روز محصولات" : "Daily Price Ticker"}
      style={{ "--ptk-duration": animationDuration } as React.CSSProperties}
    >
      <div
        className={`${styles["web-ticker__track"]} ${
          isScrollable
            ? styles["web-ticker__track--scroll"]
            : styles["web-ticker__track--static"]
        }`}
      >
        {/* Date / Label Badge */}
        <div className={styles["web-ticker__badge-wrap"]}>
          <span className={styles["web-ticker__date"]}>
            <TrendingUp style={{ width: "0.875rem", height: "0.875rem" }} />
            <span>{fa ? `قیمت روز (${date}):` : `Daily Prices (${date}):`}</span>
          </span>
        </div>

        {displayItems.map((item, idx) => {
          const name = fa ? item.name : item.nameEn
          const hasPrev =
            item.previousPrice !== null &&
            item.previousPrice !== undefined &&
            item.previousPrice > 0
          const diff = hasPrev ? item.price - (item.previousPrice as number) : 0
          const diffPct = hasPrev
            ? Math.abs((diff / (item.previousPrice as number)) * 100).toFixed(1)
            : "0"

          const ItemContent = (
            <div className={styles["web-ticker__item"]}>
              <span className={styles["web-ticker__name"]}>{name}</span>
              <span className={styles["web-ticker__price"]}>
                {formatToman(item.price)}{" "}
                <span className={styles["web-ticker__currency"]}>
                  {fa ? "تومان" : "Toman"}
                </span>
              </span>

              {hasPrev && diff !== 0 && (
                <span
                  className={`${styles["web-ticker__change"]} ${
                    diff > 0
                      ? styles["web-ticker__change--up"]
                      : styles["web-ticker__change--down"]
                  }`}
                  title={
                    fa
                      ? `قیمت قبلی: ${formatToman(item.previousPrice!)} تومان`
                      : `Previous: ${item.previousPrice!.toLocaleString()} Toman`
                  }
                >
                  {diff > 0 ? (
                    <ArrowUpRight style={{ width: "0.75rem", height: "0.75rem" }} />
                  ) : (
                    <ArrowDownRight style={{ width: "0.75rem", height: "0.75rem" }} />
                  )}
                  <span>{diffPct}%</span>
                </span>
              )}
            </div>
          )

          return (
            <div key={`${item.id}-${idx}`} className={styles["web-ticker__card-wrap"]}>
              {item.slug ? (
                <Link
                  href={`/${locale}/products/${item.slug}`}
                  className={styles["web-ticker__link"]}
                  aria-label={`${name} — ${formatToman(item.price)} ${
                    fa ? "تومان" : "Toman"
                  }`}
                >
                  {ItemContent}
                </Link>
              ) : (
                ItemContent
              )}
              <span className={styles["web-ticker__sep"]} aria-hidden="true" />
            </div>
          )
        })}
      </div>
    </aside>
  )
}