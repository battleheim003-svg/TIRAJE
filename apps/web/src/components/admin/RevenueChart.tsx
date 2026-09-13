import React from "react"
import { TrendingUp } from "lucide-react"
import { formatToman } from "@tirajeh/shared"
import type { DailyStat } from "@/lib/sales-stats"
import styles from "./RevenueChart.module.css"

interface RevenueChartProps {
  data: DailyStat[]
  locale: string
}

export function RevenueChart({ data, locale }: RevenueChartProps) {
  const fa = locale === "fa"

  // اگر داده وجود نداشت یا خالی بود
  if (!data || data.length === 0) {
    return (
      <section className={styles["web-adm-rev__root"]} aria-labelledby="revenue-chart-heading">
        <div className={styles["web-adm-rev__header"]}>
          <div className={styles["web-adm-rev__title-wrap"]}>
            <h2 id="revenue-chart-heading" className={styles["web-adm-rev__title"]}>
              {fa ? "روند درآمد و تناژ فروش (۳۰ روز گذشته)" : "Revenue & Tonnage Trend (Last 30 Days)"}
            </h2>
          </div>
        </div>
        <div className={styles["web-adm-rev__empty"]}>
          {fa ? "داده‌ای برای نمایش وجود ندارد" : "No data available to display"}
        </div>
      </section>
    )
  }

  // مختصات viewBox
  const width = 600
  const height = 200
  const padLeft = 45   // فضای محور Y ثانویه (تناژ)
  const padRight = 65  // فضای محور Y اولیه (درآمد تومان)
  const padTop = 20
  const padBottom = 30
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  // مقیاس‌ها
  const maxRevenue = Math.max(...data.map((d) => d.revenueToman), 1_000_000)
  const maxWeight = Math.max(...data.map((d) => d.weightTon), 10)

  // نقاط نمودار (RTL: راست به چپ -> ایندکس 0 قدیمی‌ترین در سمت راست)
  const totalDays = data.length - 1 || 1
  const pointsRev = data.map((d, i) => {
    // برای RTL: اندیس 0 (قدیمی‌ترین) در سمت راست (width - padRight) یا از چپ به راست سنتی
    // در نمودارهای مالی تقویمی استاندارد RTL، زمان از چپ به راست جریان دارد و برچسب‌های ارز در راست قرار دارند.
    const x = padLeft + (i / totalDays) * chartW
    const y = padTop + chartH - (d.revenueToman / maxRevenue) * chartH
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, data: d }
  })

  const pointsWeight = data.map((d, i) => {
    const x = padLeft + (i / totalDays) * chartW
    const y = padTop + chartH - (d.weightTon / maxWeight) * chartH
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, data: d }
  })

  const pathRev = pointsRev.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  )

  const pathWeight = pointsWeight.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  )

  const fillRev = `${pathRev} L ${padLeft + chartW},${padTop + chartH} L ${padLeft},${padTop + chartH} Z`

  // خطوط افقی Grid (3 خط)
  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padTop + chartH - ratio * chartH
    const revVal = Math.round(ratio * maxRevenue)
    const weightVal = Math.round(ratio * maxWeight * 10) / 10
    return { y: Math.round(y * 10) / 10, revVal, weightVal }
  })

  // برچسب‌های محور افقی (هر ۵ روز یکبار)
  const xTicks = data.filter((_, i) => i % 5 === 0 || i === data.length - 1)

  return (
    <section className={styles["web-adm-rev__root"]} aria-labelledby="revenue-chart-heading">
      <div className={styles["web-adm-rev__header"]}>
        <div className={styles["web-adm-rev__title-wrap"]}>
          <h2 id="revenue-chart-heading" className={styles["web-adm-rev__title"]}>
            <TrendingUp style={{ width: "1.125rem", height: "1.125rem", display: "inline-block", verticalAlign: "middle", marginInlineEnd: "0.5rem" }} />
            <span>{fa ? "روند درآمد و تناژ فروش (۳۰ روز گذشته)" : "Revenue & Tonnage Trend (Last 30 Days)"}</span>
          </h2>
          <span className={styles["web-adm-rev__subtitle"]}>
            {fa ? "تحلیل سفارش‌های تأیید شده و تحویل داده شده" : "Analytics of confirmed and processed orders"}
          </span>
        </div>

        <div className={styles["web-adm-rev__legend"]}>
          <div className={styles["web-adm-rev__legend-item"]}>
            <span className={styles["web-adm-rev__legend-dot"]} style={{ backgroundColor: "var(--color-accent)" }} />
            <span>{fa ? "درآمد (تومان)" : "Revenue (Toman)"}</span>
          </div>
          <div className={styles["web-adm-rev__legend-item"]}>
            <span className={styles["web-adm-rev__legend-dot"]} style={{ backgroundColor: "#10b981" }} />
            <span>{fa ? "تناژ (تن)" : "Weight (Tons)"}</span>
          </div>
        </div>
      </div>

      <div className={styles["web-adm-rev__svg-container"]}>
        <svg
          role="img"
          aria-label={fa ? "نمودار خطی درآمد و تناژ ۳۰ روز اخیر" : "30-day revenue and tonnage line chart"}
          viewBox={`0 0 ${width} ${height}`}
          className={styles["web-adm-rev__svg"]}
        >
          {/* خطوط پس‌زمینه Grid */}
          {gridLines.map((gl, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={gl.y}
                x2={padLeft + chartW}
                y2={gl.y}
                stroke="var(--color-border)"
                strokeDasharray="4 4"
                opacity={0.3}
              />
              {/* برچسب درآمد در سمت راست (RTL) */}
              <text
                x={padLeft + chartW + 6}
                y={gl.y + 3}
                fill="var(--color-text-muted)"
                fontSize="9"
                textAnchor="start"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatToman(gl.revVal, fa ? "fa" : "en", { unit: false })}
              </text>
              {/* برچسب تناژ در سمت چپ */}
              <text
                x={padLeft - 6}
                y={gl.y + 3}
                fill="var(--color-text-muted)"
                fontSize="9"
                textAnchor="end"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fa ? `${gl.weightVal.toLocaleString("fa-IR")} ت` : `${gl.weightVal}t`}
              </text>
            </g>
          ))}

          {/* خط پایه محور افقی */}
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={padLeft + chartW}
            y2={padTop + chartH}
            stroke="var(--color-border)"
            strokeWidth={1}
          />

          {/* سایه ملایم زیر خط درآمد */}
          <path d={fillRev} fill="var(--color-accent)" opacity={0.08} />

          {/* خط درآمد */}
          <path
            d={pathRev}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* خط تناژ */}
          <path
            d={pathWeight}
            fill="none"
            stroke="#10b981"
            strokeWidth={1.8}
            strokeDasharray="3 1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* نقاط تعاملی با تگ title برای دسترس‌پذیری */}
          {pointsRev.map((pt, i) => (
            <circle
              key={`rev-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              fill="var(--color-accent)"
              stroke="var(--color-bg-elevated)"
              strokeWidth={1.5}
            >
              <title>{`${pt.data.dateKey} - درآمد: ${formatToman(pt.data.revenueToman)}`}</title>
            </circle>
          ))}

          {pointsWeight.map((pt, i) => (
            <circle
              key={`wt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2}
              fill="#10b981"
            >
              <title>{`${pt.data.dateKey} - وزن: ${fa ? pt.data.weightTon.toLocaleString("fa-IR") : pt.data.weightTon} تن`}</title>
            </circle>
          ))}

          {/* برچسب‌های تاریخ محور X */}
          {xTicks.map((d, idx) => {
            const origIdx = data.indexOf(d)
            const x = padLeft + (origIdx / totalDays) * chartW
            const shortDate = d.dateKey.split("-").slice(1).join("/") // ماه/روز
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                fill="var(--color-text-muted)"
                fontSize="8.5"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {shortDate}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
