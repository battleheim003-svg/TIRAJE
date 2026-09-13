"use client"

import { useState, useTransition } from "react"
import { adminUpdateOrderStatusAction } from "@/actions/admin-orders"
import { ORDER_TRANSITIONS } from "@tirajeh/shared"
import type { OrderStatus } from "@tirajeh/database"
import styles from "./OrderDetail.module.css"

const ORDER_STATUS_LABELS: Record<string, { fa: string; en: string }> = {
  PENDING:          { fa: "در انتظار",        en: "Pending"          },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت",   en: "Awaiting Payment" },
  CONFIRMED:        { fa: "تأیید شده",        en: "Confirmed"        },
  PROCESSING:       { fa: "در حال پردازش",   en: "Processing"       },
  SHIPPED:          { fa: "ارسال شده",        en: "Shipped"          },
  DELIVERED:        { fa: "تحویل داده شده",  en: "Delivered"        },
  CANCELLED:        { fa: "لغو شده",          en: "Cancelled"        },
  REFUNDED:         { fa: "مسترد شده",        en: "Refunded"         },
}

interface Props {
  orderId: string
  currentStatus: string
  fa: boolean
}

export default function OrderStatusForm({ orderId, currentStatus, fa }: Props) {
  const allowedNextStatuses = ORDER_TRANSITIONS[currentStatus as OrderStatus] ?? []
  const [status, setStatus] = useState<string>(allowedNextStatuses[0] ?? currentStatus)
  const [note, setNote] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData()
    fd.set("orderId", orderId)
    fd.set("status", status)
    fd.set("note", note)
    startTransition(async () => {
      try {
        const res = await adminUpdateOrderStatusAction(fd)
        if (res && "success" in res && !res.success) {
          setError(res.error)
          return
        }
        setSuccess(true)
        setNote("")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "خطا در به‌روزرسانی")
      }
    })
  }

  const currentLabel = ORDER_STATUS_LABELS[currentStatus]
    ? (fa ? ORDER_STATUS_LABELS[currentStatus].fa : ORDER_STATUS_LABELS[currentStatus].en)
    : currentStatus

  const isTerminal = allowedNextStatuses.length === 0

  return (
    <form onSubmit={handleSubmit} className={styles["web-adm-ord__form"]}>
      <div className={styles["web-adm-ord__formRow"]}>
        <div className={styles["web-adm-ord__field"]}>
          <label className={styles["web-adm-ord__label"]} htmlFor="osf-status">
            {fa ? "وضعیت جدید" : "New Status"}
          </label>
          <select
            id="osf-status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSuccess(false) }}
            disabled={isPending || isTerminal}
            className={styles["web-adm-ord__select"]}
          >
            {/* Current status as disabled option */}
            <option value={currentStatus} disabled>
              {fa ? `${currentLabel} (وضعیت فعلی)` : `${currentLabel} (Current)`}
            </option>

            {/* Allowed next transitions */}
            {allowedNextStatuses.map((st) => {
              const label = ORDER_STATUS_LABELS[st]
                ? (fa ? ORDER_STATUS_LABELS[st].fa : ORDER_STATUS_LABELS[st].en)
                : st
              return (
                <option key={st} value={st}>
                  {label}
                </option>
              )
            })}
          </select>
        </div>

        <div className={`${styles["web-adm-ord__field"]} ${styles["web-adm-ord__fieldNote"]}`}>
          <label className={styles["web-adm-ord__label"]} htmlFor="osf-note">
            {fa ? "یادداشت (اختیاری)" : "Note (optional)"}
          </label>
          <input
            id="osf-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending || isTerminal}
            className={styles["web-adm-ord__input"]}
            placeholder={fa ? "دلیل تغییر وضعیت..." : "Reason for status change..."}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isTerminal || status === currentStatus}
          className={styles["web-adm-ord__btn"]}
        >
          {isPending
            ? (fa ? "در حال ذخیره..." : "Saving...")
            : (fa ? "ذخیره وضعیت" : "Save Status")}
        </button>
      </div>

      {isTerminal && (
        <p style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.5rem" }}>
          {fa
            ? "این سفارش در وضعیت نهایی است و امکان تغییر وضعیت وجود ندارد."
            : "This order is in a final state and cannot be transitioned further."}
        </p>
      )}

      {success && (
        <p className={styles["web-adm-ord__success"]} role="status">
          {fa ? "وضعیت با موفقیت به‌روز شد." : "Status updated successfully."}
        </p>
      )}
      {error && (
        <p className={styles["web-adm-ord__error"]} role="alert">{error}</p>
      )}
    </form>
  )
}
