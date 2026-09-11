"use client"

import { useState, useTransition } from "react"
import { adminUpdateOrderStatusAction } from "@/actions/admin-orders"
import styles from "./OrderDetail.module.css"

const ORDER_STATUSES = [
  { value: "PENDING",          fa: "در انتظار",        en: "Pending"          },
  { value: "AWAITING_PAYMENT", fa: "انتظار پرداخت",   en: "Awaiting Payment" },
  { value: "CONFIRMED",        fa: "تأیید شده",        en: "Confirmed"        },
  { value: "PROCESSING",       fa: "در حال پردازش",   en: "Processing"       },
  { value: "SHIPPED",          fa: "ارسال شده",        en: "Shipped"          },
  { value: "DELIVERED",        fa: "تحویل داده شده",  en: "Delivered"        },
  { value: "CANCELLED",        fa: "لغو شده",          en: "Cancelled"        },
  { value: "REFUNDED",         fa: "مسترد شده",        en: "Refunded"         },
]

interface Props {
  orderId: string
  currentStatus: string
  fa: boolean
}

export default function OrderStatusForm({ orderId, currentStatus, fa }: Props) {
  const [status, setStatus] = useState(currentStatus)
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
        await adminUpdateOrderStatusAction(fd)
        setSuccess(true)
        setNote("")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "خطا در به‌روزرسانی")
      }
    })
  }

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
            className={styles["web-adm-ord__select"]}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {fa ? s.fa : s.en}
              </option>
            ))}
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
            className={styles["web-adm-ord__input"]}
            placeholder={fa ? "دلیل تغییر وضعیت..." : "Reason for status change..."}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || status === currentStatus}
          className={styles["web-adm-ord__btn"]}
        >
          {isPending
            ? (fa ? "در حال ذخیره..." : "Saving...")
            : (fa ? "ذخیره وضعیت" : "Save Status")}
        </button>
      </div>

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
