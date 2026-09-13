import React from "react"
import { toFarsiDigits } from "@tirajeh/shared"
import type { ConversionStat } from "@/lib/sales-stats"
import styles from "./ConversionCard.module.css"

interface ConversionCardProps {
  conversion: ConversionStat
  locale: string
}

export function ConversionCard({ conversion, locale }: ConversionCardProps) {
  const fa = locale === "fa"
  const ratePercent = Math.min(100, Math.max(0, conversion.rate * 100))
  const percentText = fa
    ? `${toFarsiDigits(ratePercent.toFixed(1))}٪`
    : `${ratePercent.toFixed(1)}%`

  // پارامترهای دایره SVG پیشرفت
  const size = 110
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (ratePercent / 100) * circumference

  const totalStr = fa ? toFarsiDigits(conversion.quotesTotal) : conversion.quotesTotal
  const convStr = fa ? toFarsiDigits(conversion.quotesConverted) : conversion.quotesConverted

  return (
    <section className={styles["web-adm-conv__root"]} aria-labelledby="conversion-card-heading">
      <div className={styles["web-adm-conv__info"]}>
        <h2 id="conversion-card-heading" className={styles["web-adm-conv__title"]}>
          {fa ? "نرخ تبدیل استعلام به سفارش" : "Quote-to-Order Conversion Rate"}
        </h2>
        <div className={styles["web-adm-conv__number"]}>{percentText}</div>
        <p className={styles["web-adm-conv__desc"]}>
          {fa
            ? `${convStr} از ${totalStr} استعلام قیمت ۳۰ روز گذشته با موفقیت به سفارش تبدیل شده است.`
            : `${convStr} of ${totalStr} quote requests in the last 30 days converted into orders.`}
        </p>
      </div>

      <div className={styles["web-adm-conv__chart-wrap"]}>
        <svg
          role="img"
          aria-label={fa ? `نرخ تبدیل: ${percentText}` : `Conversion rate: ${percentText}`}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* دایره پس‌زمینه */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-surface)"
            strokeWidth={strokeWidth}
          />
          {/* دایره پیشرفت */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
      </div>
    </section>
  )
}
