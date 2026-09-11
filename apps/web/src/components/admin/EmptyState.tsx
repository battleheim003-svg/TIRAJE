"use client"

import React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import styles from "./EmptyState.module.css"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.esRoot}>
      <div className={styles.esIconWrap}>
        <Icon style={{ width: "1.75rem", height: "1.75rem" }} aria-hidden="true" />
      </div>
      <h3 className={styles.esTitle}>{title}</h3>
      {description && <p className={styles.esDesc}>{description}</p>}
      {action && (
        <Link href={action.href} className={styles.esActionBtn}>
          {action.label}
        </Link>
      )}
    </div>
  )
}
