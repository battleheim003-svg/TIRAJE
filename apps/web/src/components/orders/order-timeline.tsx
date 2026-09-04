import { Check, Clock, Truck, Package, XCircle, RotateCcw } from "lucide-react"

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

interface TimelineStep {
  status: OrderStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const STEPS: TimelineStep[] = [
  { status: "PENDING",    label: "ثبت سفارش",      icon: Clock    },
  { status: "CONFIRMED",  label: "تأیید سفارش",     icon: Check    },
  { status: "PROCESSING", label: "آماده‌سازی",       icon: Package  },
  { status: "SHIPPED",    label: "ارسال شد",        icon: Truck    },
  { status: "DELIVERED",  label: "تحویل داده شد",   icon: Check    },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING:    0,
  CONFIRMED:  1,
  PROCESSING: 2,
  SHIPPED:    3,
  DELIVERED:  4,
  CANCELLED:  -1,
  REFUNDED:   -1,
}

interface OrderTimelineProps {
  status: OrderStatus
  createdAt?: Date
  updatedAt?: Date
  className?: string
}

export function OrderTimeline({ status, className }: OrderTimelineProps) {
  const currentIndex = STATUS_ORDER[status]
  const isCancelled = status === "CANCELLED" || status === "REFUNDED"

  if (isCancelled) {
    return (
      <div
        className={`ot-cancelled${className ? ` ${className}` : ""}`}
        role="status"
      >
        {status === "REFUNDED" ? (
          <RotateCcw className="ot-cancelled-icon" aria-hidden="true" />
        ) : (
          <XCircle className="ot-cancelled-icon" aria-hidden="true" />
        )}
        <span className="ot-cancelled-label">
          {status === "REFUNDED" ? "مبلغ بازگردانده شد" : "سفارش لغو شد"}
        </span>

        <style>{`
          .ot-cancelled {
            display: flex; align-items: center; gap: 0.75rem;
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-danger-subtle);
            background-color: var(--color-danger-subtle);
            padding: 0.75rem 1rem;
          }
          .ot-cancelled-icon { width: 1.25rem; height: 1.25rem; color: var(--color-danger); flex-shrink: 0; }
          .ot-cancelled-label { font-size: 0.875rem; font-weight: 500; color: var(--color-danger); }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <ol
        className={`ot-root${className ? ` ${className}` : ""}`}
        aria-label="مراحل سفارش"
      >
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex > index
          const isCurrent   = currentIndex === index
          const Icon = step.icon

          const iconCls = isCompleted
            ? "ot-icon ot-icon--done"
            : isCurrent
              ? "ot-icon ot-icon--current"
              : "ot-icon ot-icon--pending"

          const lineCls = isCompleted ? "ot-line ot-line--done" : "ot-line"
          const labelCls = (isCompleted || isCurrent) ? "ot-label ot-label--active" : "ot-label"
          const innerIconCls = isCompleted
            ? "ot-icon-inner ot-icon-inner--done"
            : isCurrent
              ? "ot-icon-inner ot-icon-inner--current"
              : "ot-icon-inner ot-icon-inner--pending"

          return (
            <li key={step.status} className="ot-step">
              {index < STEPS.length - 1 && (
                <span aria-hidden="true" className={lineCls} />
              )}

              <span aria-hidden="true" className={iconCls}>
                <Icon className={innerIconCls} />
              </span>

              <div className="ot-content">
                <span className={labelCls}>{step.label}</span>
                {isCurrent && (
                  <span className="ot-current-label">وضعیت فعلی</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <style>{`
        .ot-root { display: flex; flex-direction: column; gap: 0; list-style: none; padding: 0; margin: 0; }
        .ot-step { position: relative; display: flex; gap: 1rem; }
        .ot-line {
          position: absolute; inset-inline-start: 0.9375rem; top: 2rem;
          height: calc(100% - 1.5rem); width: 2px;
          background-color: var(--color-border); transform: translateX(-50%);
        }
        [dir="rtl"] .ot-line { transform: translateX(50%); }
        .ot-line--done { background-color: var(--color-accent); }
        .ot-icon {
          position: relative; z-index: 1; flex-shrink: 0;
          width: 2rem; height: 2rem;
          display: flex; align-items: center; justify-content: center;
          border-radius: 999px; border: 2px solid;
          transition: border-color var(--transition-fast), background-color var(--transition-fast);
        }
        .ot-icon--done    { border-color: var(--color-accent); background-color: var(--color-accent); }
        .ot-icon--current { border-color: var(--color-accent); background-color: var(--color-surface); }
        .ot-icon--pending { border-color: var(--color-border); background-color: var(--color-surface); }
        .ot-icon-inner { width: 0.875rem; height: 0.875rem; }
        .ot-icon-inner--done    { color: #fff; }
        .ot-icon-inner--current { color: var(--color-accent); }
        .ot-icon-inner--pending { color: var(--color-text-muted); }
        .ot-content { display: flex; flex-direction: column; padding-bottom: 1.5rem; padding-top: 0.25rem; }
        .ot-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-muted); }
        .ot-label--active { color: var(--color-text); }
        .ot-current-label { font-size: 0.75rem; color: var(--color-accent); margin-top: 0.125rem; }
      `}</style>
    </>
  )
}
