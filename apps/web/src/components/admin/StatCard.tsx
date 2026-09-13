import React from "react"
import Link from "next/link"
import { Sparkline } from "./Sparkline"
import styles from "./StatCard.module.css"

export interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string | number
    direction: "up" | "down"
    label?: string
  }
  desc?: string
  href?: string
  sparkData?: number[]
}

export function StatCard({ label, value, icon, trend, desc, href, sparkData }: StatCardProps) {
  const content = (
    <>
      <div className={styles["web-adm-kpi__top"]}>
        <div className={styles["web-adm-kpi__icon-wrap"]}>{icon}</div>
        {trend && (
          <span
            className={[
              styles["web-adm-kpi__trend"],
              trend.direction === "up"
                ? styles["web-adm-kpi__trend--up"]
                : styles["web-adm-kpi__trend--down"],
            ].join(" ")}
          >
            {trend.direction === "up" ? "+" : "-"}
            {trend.value}
            {trend.label ? ` ${trend.label}` : ""}
          </span>
        )}
      </div>

      <div className={styles["web-adm-kpi__content"]}>
        <span className={styles["web-adm-kpi__value"]}>{value}</span>
        <span className={styles["web-adm-kpi__label"]}>{label}</span>
      </div>

      {(desc || sparkData) && (
        <div className={styles["web-adm-kpi__bottom"]}>
          {desc && <span className={styles["web-adm-kpi__desc"]}>{desc}</span>}
          {sparkData && (
            <div className={styles["web-adm-kpi__sparkline"]}>
              <Sparkline data={sparkData} width={72} height={24} fill />
            </div>
          )}
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={[styles["web-adm-kpi__card"], styles["web-adm-kpi__card--link"]].join(" ")}
      >
        {content}
      </Link>
    )
  }

  return <div className={styles["web-adm-kpi__card"]}>{content}</div>
}
