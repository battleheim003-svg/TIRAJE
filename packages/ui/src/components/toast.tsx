"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import styles from "./Toast.module.css"

export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={[styles["ui-toast__viewport"], className].filter(Boolean).join(" ")}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

type ToastVariant = "default" | "success" | "error" | "info"

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant
  title?: string
  description?: string
}

const variantStyles: Record<ToastVariant, string> = {
  default: styles["ui-toast--default"],
  success: styles["ui-toast--success"],
  error: styles["ui-toast--error"],
  info: styles["ui-toast--info"],
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: (
    <CheckCircle2
      className={`${styles["ui-toast__icon"]} ${styles["ui-toast__icon--success"]}`}
      style={{ width: "1rem", height: "1rem" }}
    />
  ),
  error: (
    <AlertCircle
      className={`${styles["ui-toast__icon"]} ${styles["ui-toast__icon--error"]}`}
      style={{ width: "1rem", height: "1rem" }}
    />
  ),
  info: (
    <Info
      className={`${styles["ui-toast__icon"]} ${styles["ui-toast__icon--info"]}`}
      style={{ width: "1rem", height: "1rem" }}
    />
  ),
}

export function Toast({ className, variant = "default", title, description, children, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={[styles["ui-toast__root"], variantStyles[variant], className].filter(Boolean).join(" ")}
      {...props}
    >
      {variantIcons[variant]}
      <div className={styles["ui-toast__body"]}>
        {title && (
          <ToastPrimitive.Title className={styles["ui-toast__title"]}>
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className={styles["ui-toast__description"]}>
            {description}
          </ToastPrimitive.Description>
        )}
        {children}
      </div>
      <ToastPrimitive.Close className={styles["ui-toast__close"]}>
        <X style={{ width: "1rem", height: "1rem" }} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

// ── useToast hook ─────────────────────────────────────────────────────────────

type ToastItem = {
  id: string
  variant?: ToastVariant
  title?: string
  description?: string
  duration?: number
}

type ToastState = {
  toasts: ToastItem[]
}

const listeners: Array<(state: ToastState) => void> = []
let memState: ToastState = { toasts: [] }

function dispatch(action: { type: "add"; toast: ToastItem } | { type: "remove"; id: string }) {
  if (action.type === "add") {
    memState = { toasts: [action.toast, ...memState.toasts].slice(0, 5) }
  } else {
    memState = { toasts: memState.toasts.filter((t) => t.id !== action.id) }
  }
  listeners.forEach((l) => l(memState))
}

export function toast(props: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).slice(2)
  dispatch({ type: "add", toast: { ...props, id } })
  return id
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])
  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: "remove", id }),
  }
}

// ── Toaster component ─────────────────────────────────────────────────────────

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          title={t.title}
          description={t.description}
          duration={t.duration ?? 4000}
          onOpenChange={(open) => { if (!open) dismiss(t.id) }}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
