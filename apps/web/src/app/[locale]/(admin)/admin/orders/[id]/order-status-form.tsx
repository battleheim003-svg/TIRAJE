"use client"

import { useState, useTransition } from "react"
import { adminUpdateOrderStatusAction } from "@/actions/admin-orders"

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
    <>
      <form onSubmit={handleSubmit} className="osf-form">
        <div className="osf-row">
          <div className="osf-field">
            <label className="osf-label" htmlFor="osf-status">
              {fa ? "وضعیت جدید" : "New Status"}
            </label>
            <select
              id="osf-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSuccess(false) }}
              className="osf-select"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {fa ? s.fa : s.en}
                </option>
              ))}
            </select>
          </div>

          <div className="osf-field osf-field--note">
            <label className="osf-label" htmlFor="osf-note">
              {fa ? "یادداشت (اختیاری)" : "Note (optional)"}
            </label>
            <input
              id="osf-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="osf-input"
              placeholder={fa ? "دلیل تغییر وضعیت..." : "Reason for status change..."}
            />
          </div>

          <button
            type="submit"
            disabled={isPending || status === currentStatus}
            className="osf-btn"
          >
            {isPending
              ? (fa ? "در حال ذخیره..." : "Saving...")
              : (fa ? "ذخیره وضعیت" : "Save Status")}
          </button>
        </div>

        {success && (
          <p className="osf-success" role="status">
            {fa ? "وضعیت با موفقیت به‌روز شد." : "Status updated successfully."}
          </p>
        )}
        {error && (
          <p className="osf-error" role="alert">{error}</p>
        )}
      </form>

      <style>{`
        .osf-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .osf-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-end;
        }
        .osf-field { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
        .osf-field--note { flex: 1; min-width: 12rem; }
        .osf-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .osf-select, .osf-input {
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }
        .osf-select:focus, .osf-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
        }
        .osf-select { min-width: 10rem; }
        .osf-input { width: 100%; box-sizing: border-box; }
        .osf-btn {
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color var(--transition-fast);
          align-self: flex-end;
        }
        .osf-btn:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .osf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .osf-success {
          font-size: 0.8125rem;
          color: var(--color-success);
          background-color: var(--color-success-subtle);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }
        .osf-error {
          font-size: 0.8125rem;
          color: var(--color-danger);
          background-color: var(--color-danger-subtle);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </>
  )
}
