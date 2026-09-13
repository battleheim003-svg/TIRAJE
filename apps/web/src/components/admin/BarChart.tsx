import React from "react"
import styles from "./BarChart.module.css"

interface BarChartProps {
  items: Array<{ label: string; value: number; subLabel?: string }>
  title: string
  valueFormatter: (v: number) => string
  maxItems?: number        // پیش‌فرض 8
  color?: string
}

export function BarChart({
  items,
  title,
  valueFormatter,
  maxItems = 8,
  color = "var(--color-accent)",
}: BarChartProps) {
  const displayItems = items.slice(0, maxItems)
  const maxValue = Math.max(...displayItems.map((it) => it.value), 1)

  return (
    <section className={styles["web-adm-bar__root"]} aria-label={title}>
      <div className={styles["web-adm-bar__header"]}>
        <h2 className={styles["web-adm-bar__title"]}>{title}</h2>
      </div>

      {displayItems.length === 0 ? (
        <div className={styles["web-adm-bar__empty"]}>داده‌ای برای نمایش وجود ندارد</div>
      ) : (
        <ul className={styles["web-adm-bar__list"]} role="list">
          {displayItems.map((item, idx) => {
            const percent = Math.min(100, Math.max(4, Math.round((item.value / maxValue) * 100)))
            // Opacity کاهنده از ۱ تا ۰.۴
            const opacity = Math.max(0.4, 1 - (idx / (displayItems.length || 1)) * 0.6)

            return (
              <li key={idx} className={styles["web-adm-bar__item"]}>
                <div className={styles["web-adm-bar__labels"]}>
                  <div className={styles["web-adm-bar__label-wrap"]}>
                    <span className={styles["web-adm-bar__name"]}>{item.label}</span>
                    {item.subLabel && (
                      <span className={styles["web-adm-bar__sub"]}>({item.subLabel})</span>
                    )}
                  </div>
                  <span className={styles["web-adm-bar__val"]}>
                    {valueFormatter(item.value)}
                  </span>
                </div>

                <div
                  className={styles["web-adm-bar__track"]}
                  role="progressbar"
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  aria-label={`${item.label}: ${valueFormatter(item.value)}`}
                >
                  <div
                    className={styles["web-adm-bar__fill"]}
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                      opacity,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
