"use client"

import React, { useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Edit2, Trash2, Inbox } from "lucide-react"
import { EmptyState } from "./EmptyState"
import { SkeletonRow } from "./SkeletonRow"
import styles from "./DataTable.module.css"

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  align?: "start" | "center" | "end"
  width?: string
}

export type StatusBadgeVariant = "active" | "inactive" | "published" | "draft"

export function StatusBadge({
  variant,
  label,
}: {
  variant: StatusBadgeVariant
  label: string
}) {
  const variantClass =
    variant === "active"
      ? styles.dtBadgeActive
      : variant === "inactive"
      ? styles.dtBadgeInactive
      : variant === "published"
      ? styles.dtBadgePublished
      : styles.dtBadgeDraft

  return <span className={`${styles.dtBadge} ${variantClass}`}>{label}</span>
}

export function InlineToggle({
  value,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  value: boolean
  onChange: (nextVal: boolean) => Promise<void> | void
  disabled?: boolean
  ariaLabel?: string
}) {
  const [checked, setChecked] = useState(value)
  const [loading, setLoading] = useState(false)

  // Keep synced if value prop changes
  React.useEffect(() => {
    setChecked(value)
  }, [value])

  const handleClick = async () => {
    if (disabled || loading) return
    const next = !checked
    // Optimistic update
    setChecked(next)
    setLoading(true)
    try {
      await onChange(next)
    } catch {
      // Revert on failure
      setChecked(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      className={styles.dtSwitch}
      onClick={handleClick}
    >
      <span className={styles.dtSwitchKnob} />
    </button>
  )
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowAction?: (action: "edit" | "delete" | string, row: T) => void
  editHref?: (row: T) => string
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; href: string }
  loading?: boolean
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowAction,
  editHref,
  emptyIcon = Inbox,
  emptyTitle = "موردی یافت نشد",
  emptyDescription,
  emptyAction,
  loading = false,
}: DataTableProps<T>) {
  const hasQuickActions = Boolean(onRowAction || editHref)

  if (!loading && data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className={styles.dtContainer}>
      <div className={styles.dtTableWrap}>
        <table className={styles.dtTable} role="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={styles.dtHeadTh}
                  style={{
                    textAlign: col.align ? (col.align === "start" ? "start" : col.align === "end" ? "end" : "center") : "start",
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
              {hasQuickActions && (
                <th scope="col" className={styles.dtHeadTh} style={{ width: "6rem", textAlign: "end" }}>
                  <span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}>
                    عملیات
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRow columnsCount={columns.length + (hasQuickActions ? 1 : 0)} rowsCount={5} />
            ) : (
              data.map((row) => {
                const rowKey = keyExtractor(row)
                return (
                  <tr key={rowKey} className={styles.dtRow}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={styles.dtCell}
                        style={{
                          textAlign: col.align ? (col.align === "start" ? "start" : col.align === "end" ? "end" : "center") : "start",
                        }}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}

                    {hasQuickActions && (
                      <td className={styles.dtCell} style={{ textAlign: "end" }}>
                        <div className={styles.dtQuickActions}>
                          {editHref ? (
                            <Link
                              href={editHref(row)}
                              className={styles.dtActionBtn}
                              title="ویرایش"
                              aria-label="ویرایش"
                            >
                              <Edit2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                            </Link>
                          ) : onRowAction ? (
                            <button
                              type="button"
                              onClick={() => onRowAction("edit", row)}
                              className={styles.dtActionBtn}
                              title="ویرایش"
                              aria-label="ویرایش"
                            >
                              <Edit2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                            </button>
                          ) : null}

                          {onRowAction && (
                            <button
                              type="button"
                              onClick={() => onRowAction("delete", row)}
                              className={`${styles.dtActionBtn} ${styles.dtActionBtnDanger}`}
                              title="حذف"
                              aria-label="حذف"
                            >
                              <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
