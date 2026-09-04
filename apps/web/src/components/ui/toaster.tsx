"use client"

import { createContext, useContext, useState, useCallback, useEffect, useId } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

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
    success: <CheckCircle2 className="tr-icon tr-icon--success" aria-hidden="true" />,
    error:   <AlertCircle   className="tr-icon tr-icon--error"   aria-hidden="true" />,
    info:    <Info          className="tr-icon tr-icon--info"     aria-hidden="true" />,
  }

  return (
    <ToastContext.Provider value={{ toast: add }}>
      {children}
      <div className="tr-viewport" role="region" aria-label="اعلان‌ها" aria-live="polite">
        {items.map((item) => {
          const variant = item.variant ?? "default"
          return (
            <div key={item.id} className={`tr-item tr-item--${variant}`} role="status">
              {ICONS[variant]}
              <div className="tr-body">
                {item.title && <p className="tr-title">{item.title}</p>}
                {item.description && <p className="tr-desc">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="tr-close"
                aria-label="بستن"
              >
                <X className="tr-close-icon" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
        .tr-viewport {
          position: fixed; bottom: 1rem; inset-inline-end: 1rem; z-index: 9999;
          display: flex; flex-direction: column; gap: 0.5rem;
          max-width: 22rem; width: calc(100vw - 2rem);
          pointer-events: none;
        }
        .tr-item {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.875rem 1rem; border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          box-shadow: var(--shadow-lg);
          pointer-events: auto;
          animation: tr-slide-in 200ms ease;
        }
        @keyframes tr-slide-in {
          from { opacity: 0; transform: translateY(0.5rem); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tr-item--success { border-color: var(--color-success); background-color: var(--color-success-subtle); }
        .tr-item--error   { border-color: var(--color-danger);  background-color: var(--color-danger-subtle); }
        .tr-item--info    { border-color: var(--color-info);    background-color: var(--color-info-subtle); }
        .tr-icon { width: 1rem; height: 1rem; flex-shrink: 0; margin-top: 0.125rem; }
        .tr-icon--success { color: var(--color-success); }
        .tr-icon--error   { color: var(--color-danger); }
        .tr-icon--info    { color: var(--color-info); }
        .tr-body { flex: 1; min-width: 0; }
        .tr-title { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
        .tr-desc  { font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 0.125rem; }
        .tr-close {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          width: 1.25rem; height: 1.25rem; border-radius: var(--radius-sm);
          background: none; border: none; cursor: pointer;
          color: var(--color-text-muted); transition: color var(--transition-fast);
        }
        .tr-close:hover { color: var(--color-text); }
        .tr-close-icon { width: 0.875rem; height: 0.875rem; }
      `}</style>
    </ToastContext.Provider>
  )
}
