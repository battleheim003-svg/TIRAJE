"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import styles from "./Toaster.module.css"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "info"

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <Toaster>")
  return ctx
}

/** Convenience: call directly from a module-level toast() import */
let _dispatch: ((opts: Omit<ToastItem, "id">) => void) | null = null

export function toast(opts: Omit<ToastItem, "id">) {
  _dispatch?.(opts)
}

// ── Toaster component ─────────────────────────────────────────────────────────

const DURATION = 4500

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const add = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev, { id, ...opts }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, DURATION)
  }, [])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    _dispatch = add
    return () => { _dispatch = null }
  }, [add])

  const ICONS: Record<ToastVariant, React.ReactNode> = {
    default: null,
    success: (
      <CheckCircle2
        className={`${styles["web-toaster__icon"]} ${styles["web-toaster__iconSuccess"]}`}
        style={{ width: "1rem", height: "1rem" }}
        aria-hidden="true"
      />
    ),
    error: (
      <AlertCircle
        className={`${styles["web-toaster__icon"]} ${styles["web-toaster__iconError"]}`}
        style={{ width: "1rem", height: "1rem" }}
        aria-hidden="true"
      />
    ),
    info: (
      <Info
        className={`${styles["web-toaster__icon"]} ${styles["web-toaster__iconInfo"]}`}
        style={{ width: "1rem", height: "1rem" }}
        aria-hidden="true"
      />
    ),
  }

  const variantItemCls: Record<ToastVariant, string> = {
    default: styles["web-toaster__itemDefault"],
    success: styles["web-toaster__itemSuccess"],
    error: styles["web-toaster__itemError"],
    info: styles["web-toaster__itemInfo"],
  }

  return (
    <ToastContext.Provider value={{ toast: add }}>
      {children}
      <div className={styles["web-toaster__viewport"]} role="region" aria-label="اعلان‌ها" aria-live="polite">
        {items.map((item) => {
          const variant = item.variant ?? "default"
          return (
            <div
              key={item.id}
              className={`${styles["web-toaster__item"]} ${variantItemCls[variant]}`}
              role="status"
            >
              {ICONS[variant]}
              <div className={styles["web-toaster__body"]}>
                {item.title && <p className={styles["web-toaster__title"]}>{item.title}</p>}
                {item.description && <p className={styles["web-toaster__desc"]}>{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className={styles["web-toaster__close"]}
                aria-label="بستن"
              >
                <X style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
