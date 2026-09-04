"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "../lib/utils"

export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 end-0 z-[100] flex max-h-screen flex-col-reverse gap-2 p-4 sm:bottom-0 sm:flex-col sm:max-w-[380px]",
      className
    )}
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
  default: "bg-[var(--color-surface)] border border-[var(--color-border)]",
  success: "bg-[var(--color-success-muted)] border border-[var(--color-success)]",
  error: "bg-[var(--color-danger-muted)] border border-[var(--color-danger)]",
  info: "bg-[var(--color-info-muted)] border border-[var(--color-info)]",
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] flex-shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-[var(--color-danger)] flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-[var(--color-info)] flex-shrink-0" />,
}

export function Toast({ className, variant = "default", title, description, children, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg p-4 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-end-full",
        "data-[state=open]:slide-in-from-end-full",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variantIcons[variant]}
      <div className="flex-1 min-w-0">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold text-[var(--color-text)]">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {description}
          </ToastPrimitive.Description>
        )}
        {children}
      </div>
      <ToastPrimitive.Close className="flex-shrink-0 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
        <X className="h-4 w-4" />
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
