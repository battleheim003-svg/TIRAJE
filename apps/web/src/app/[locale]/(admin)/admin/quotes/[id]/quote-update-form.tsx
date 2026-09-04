"use client"

import { useState, useTransition } from "react"
import { adminUpdateQuoteAction } from "@/actions/admin-quotes"

const QUOTE_STATUSES = [
  { value: "PENDING",  fa: "در انتظار",        en: "Pending"  },
  { value: "REVIEWED", fa: "بررسی شده",        en: "Reviewed" },
  { value: "QUOTED",   fa: "قیمت داده شده",    en: "Quoted"   },
  { value: "ACCEPTED", fa: "پذیرفته شده",      en: "Accepted" },
  { value: "REJECTED", fa: "رد شده",           en: "Rejected" },
]

interface Props {
  quoteId: string
  currentStatus: string
  currentQuotedPrice: number | null
  currentAdminNote: string | null
  fa: boolean
}

export default function QuoteUpdateForm({ quoteId, currentStatus, currentQuotedPrice, currentAdminNote, fa }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set("quoteId", quoteId)
    fd.set("status", status)

    startTransition(async () => {
      try {
        await adminUpdateQuoteAction(fd)
        setSuccess(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی" : "Save failed"))
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="quf-form">
        <div className="quf-row">
          <div className="quf-field">
            <label className="quf-label" htmlFor="quf-status">{fa ? "وضعیت" : "Status"}</label>
            <select
              id="quf-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSuccess(false) }}
              className="quf-select"
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{fa ? s.fa : s.en}</option>
              ))}
            </select>
          </div>

          <div className="quf-field quf-field--price">
            <label className="quf-label" htmlFor="quf-quotedPrice">{fa ? "قیمت پیشنهادی (تومان)" : "Quoted Price (Toman)"}</label>
            <input
              id="quf-quotedPrice"
              name="quotedPrice"
              type="number"
              min={0}
              step={1}
              defaultValue={currentQuotedPrice ?? ""}
              className="quf-input"
              dir="ltr"
              placeholder={fa ? "اختیاری" : "Optional"}
            />
          </div>

          <div className="quf-field quf-field--expires">
            <label className="quf-label" htmlFor="quf-expiresAt">{fa ? "تاریخ انقضا" : "Expires At"}</label>
            <input
              id="quf-expiresAt"
              name="expiresAt"
              type="date"
              className="quf-input"
              dir="ltr"
            />
          </div>
        </div>

        <div className="quf-field">
          <label className="quf-label" htmlFor="quf-adminNote">{fa ? "یادداشت مدیریت" : "Admin Note"}</label>
          <textarea
            id="quf-adminNote"
            name="adminNote"
            rows={3}
            defaultValue={currentAdminNote ?? ""}
            className="quf-textarea"
            placeholder={fa ? "توضیحات برای پیگیری داخلی..." : "Internal notes..."}
          />
        </div>

        {success && <p className="quf-success" role="status">{fa ? "با موفقیت ذخیره شد." : "Saved successfully."}</p>}
        {error && <p className="quf-error" role="alert">{error}</p>}

        <div className="quf-actions">
          <button type="submit" disabled={isPending} className="quf-submit">
            {isPending ? (fa ? "در حال ذخیره..." : "Saving...") : (fa ? "ذخیره تغییرات" : "Save Changes")}
          </button>
        </div>
      </form>

      <style>{`
        .quf-form { display: flex; flex-direction: column; gap: 1rem; }
        .quf-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
        .quf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .quf-field--price { flex: 1; min-width: 10rem; }
        .quf-field--expires { min-width: 9rem; }
        .quf-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .quf-select, .quf-input, .quf-textarea {
          background-color: var(--color-background); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 0.5625rem 0.75rem; font-size: 0.875rem;
          color: var(--color-text); transition: border-color var(--transition-fast);
          font-family: inherit; width: 100%; box-sizing: border-box;
        }
        .quf-select:focus, .quf-input:focus, .quf-textarea:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent); }
        .quf-select { min-width: 10rem; }
        .quf-textarea { resize: vertical; }
        .quf-success { font-size: 0.875rem; color: var(--color-success); background-color: var(--color-success-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .quf-error { font-size: 0.875rem; color: var(--color-danger); background-color: var(--color-danger-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .quf-actions { display: flex; justify-content: flex-end; }
        .quf-submit { background-color: var(--color-accent); color: #fff; font-size: 0.9375rem; font-weight: 700; padding: 0.625rem 1.75rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: background-color var(--transition-fast); }
        .quf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .quf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
