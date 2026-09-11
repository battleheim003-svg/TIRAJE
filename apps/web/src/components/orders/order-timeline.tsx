import { Check, Clock, Truck, Package, XCircle, RotateCcw } from "lucide-react"
import styles from "./OrderTimeline.module.css"

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
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>
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
        className={`${styles["web-order-timeline__cancelled"]}${className ? ` ${className}` : ""}`}
        role="status"
      >
        {status === "REFUNDED" ? (
          <RotateCcw
            className={styles["web-order-timeline__cancelledIcon"]}
            style={{ width: "1.25rem", height: "1.25rem" }}
            aria-hidden="true"
          />
        ) : (
          <XCircle
            className={styles["web-order-timeline__cancelledIcon"]}
            style={{ width: "1.25rem", height: "1.25rem" }}
            aria-hidden="true"
          />
        )}
        <span className={styles["web-order-timeline__cancelledLabel"]}>
          {status === "REFUNDED" ? "مبلغ بازگردانده شد" : "سفارش لغو شد"}
        </span>
      </div>
    )
  }

  return (
    <ol
      className={`${styles["web-order-timeline__root"]}${className ? ` ${className}` : ""}`}
      aria-label="مراحل سفارش"
    >
      {STEPS.map((step, index) => {
        const isCompleted = currentIndex > index
        const isCurrent   = currentIndex === index
        const Icon = step.icon

        const iconCls = isCompleted
          ? styles["web-order-timeline__iconDone"]
          : isCurrent
            ? styles["web-order-timeline__iconCurrent"]
            : styles["web-order-timeline__iconPending"]

        const lineCls = isCompleted
          ? `${styles["web-order-timeline__line"]} ${styles["web-order-timeline__lineDone"]}`
          : styles["web-order-timeline__line"]

        const labelCls = (isCompleted || isCurrent)
          ? `${styles["web-order-timeline__label"]} ${styles["web-order-timeline__labelActive"]}`
          : styles["web-order-timeline__label"]

        const innerIconCls = isCompleted
          ? styles["web-order-timeline__innerIconDone"]
          : isCurrent
            ? styles["web-order-timeline__innerIconCurrent"]
            : styles["web-order-timeline__innerIconPending"]

        return (
          <li key={step.status} className={styles["web-order-timeline__step"]}>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className={lineCls} />
            )}

            <span aria-hidden="true" className={`${styles["web-order-timeline__icon"]} ${iconCls}`}>
              <Icon
                className={innerIconCls}
                style={{ width: "0.875rem", height: "0.875rem" }}
              />
            </span>

            <div className={styles["web-order-timeline__content"]}>
              <span className={labelCls}>{step.label}</span>
              {isCurrent && (
                <span className={styles["web-order-timeline__currentLabel"]}>وضعیت فعلی</span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
