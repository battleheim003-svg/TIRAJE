"use client"

import React, { useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"
import styles from "./ConfirmDialog.module.css"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "تأیید و حذف",
  cancelLabel = "انصراف",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel()
      }
      window.addEventListener("keydown", handleKeyDown)
      confirmBtnRef.current?.focus()
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className={styles.cdOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div className={styles.cdModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cdHeader}>
          <div className={styles.cdIconWrap}>
            <AlertTriangle style={{ width: "1.5rem", height: "1.5rem" }} aria-hidden="true" />
          </div>
          <div className={styles.cdContent}>
            <h3 id="confirm-dialog-title" className={styles.cdTitle}>
              {title}
            </h3>
            <p className={styles.cdDescription}>{description}</p>
          </div>
        </div>

        <div className={styles.cdActions}>
          <button
            type="button"
            className={styles.cdCancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={styles.cdConfirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "در حال انجام..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
