"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import styles from "./Toast.module.css"

export type ToastType = "success" | "error" | "info"

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  isExiting?: boolean
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_TOASTS = 3
const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    // Mark as exiting first for exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      const timer = timersRef.current.get(id)
      if (timer) {
        clearTimeout(timer)
        timersRef.current.delete(id)
      }
    }, 200)
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).substring(2, 9)

      setToasts((prev) => {
        const next = [...prev, { id, type, message }]
        if (next.length > MAX_TOASTS) {
          const oldest = next[0]
          if (oldest) {
            const timer = timersRef.current.get(oldest.id)
            if (timer) clearTimeout(timer)
            timersRef.current.delete(oldest.id)
          }
          return next.slice(-MAX_TOASTS)
        }
        return next
      })

      const timer = setTimeout(() => {
        removeToast(id)
      }, AUTO_DISMISS_MS)

      timersRef.current.set(id, timer)
    },
    [removeToast]
  )

  const contextValue: ToastContextValue = {
    toast: {
      success: (msg: string) => addToast("success", msg),
      error: (msg: string) => addToast("error", msg),
      info: (msg: string) => addToast("info", msg),
    },
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer} aria-live="polite" role="region">
        {toasts.map((t) => {
          const variantClass =
            t.type === "success"
              ? styles.toastSuccess
              : t.type === "error"
              ? styles.toastError
              : styles.toastInfo

          return (
            <div
              key={t.id}
              className={`${styles.toastItem} ${variantClass}`}
              data-exiting={t.isExiting ? "true" : undefined}
              role="alert"
            >
              <div className={styles.toastIcon}>
                {t.type === "success" && (
                  <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
                )}
                {t.type === "error" && (
                  <AlertCircle style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
                )}
                {t.type === "info" && (
                  <Info style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
                )}
              </div>
              <div className={styles.toastMessage}>{t.message}</div>
              <button
                type="button"
                className={styles.toastClose}
                onClick={() => removeToast(t.id)}
                aria-label="بستن اعلان"
              >
                <X style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return ctx
}
