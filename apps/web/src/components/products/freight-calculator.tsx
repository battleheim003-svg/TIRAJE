"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Truck, Loader2 } from "lucide-react"
import { formatToman } from "@/lib/ui"
import { getFreightQuotesAction } from "@/actions/shipping"
import type { FreightQuote } from "@tirajeh/shared"

const PROVINCES = [
  "تهران", "اصفهان", "فارس", "خراسان رضوی", "مازندران", "آذربایجان شرقی",
  "آذربایجان غربی", "کرمانشاه", "خوزستان", "البرز", "گیلان", "قم",
  "کرمان", "هرمزگان", "سیستان و بلوچستان", "لرستان", "همدان", "گلستان",
  "مرکزی", "زنجان", "بوشهر", "اردبیل", "قزوین", "کهگیلویه و بویراحمد",
  "خراسان جنوبی", "خراسان شمالی", "چهارمحال و بختیاری", "سمنان", "ایلام",
  "یزد",
]

interface FreightCalculatorProps {
  onSelect?: (quote: FreightQuote) => void
  className?: string
}

export function FreightCalculator({ onSelect, className }: FreightCalculatorProps) {
  const t = useTranslations("freight")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
  const [quotes, setQuotes] = useState<FreightQuote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [calculated, setCalculated] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await getFreightQuotesAction(formData)
      if (result.success) {
        setQuotes(result.data)
        setCalculated(true)
      } else {
        setError(result.error)
        setCalculated(false)
      }
    })
  }

  return (
    <>
      <div className={`fc-root${className ? ` ${className}` : ""}`}>
        <div className="fc-header">
          <Truck className="fc-header-icon" aria-hidden="true" />
          <h2 className="fc-header-title">{t("title")}</h2>
        </div>

        <form onSubmit={handleSubmit} className="fc-form">
          <div className="fc-row">
            {/* Province */}
            <div className="fc-field">
              <label htmlFor="freight-province" className="fc-label">{t("province")}</label>
              <select
                id="freight-province"
                name="province"
                required
                className="fc-select"
              >
                <option value="">انتخاب استان</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="fc-field">
              <label htmlFor="freight-city" className="fc-label">{t("city")}</label>
              <input
                id="freight-city"
                name="city"
                type="text"
                required
                placeholder="نام شهر"
                className="fc-input"
              />
            </div>

            {/* Weight */}
            <div className="fc-field">
              <label htmlFor="freight-weight" className="fc-label">{t("weight")}</label>
              <input
                id="freight-weight"
                name="totalWeightTon"
                type="number"
                step="0.5"
                min="0.5"
                max="26"
                required
                placeholder="۱"
                className="fc-input"
              />
            </div>
          </div>

          <button type="submit" disabled={isPending} className="fc-btn">
            {isPending ? (
              <>
                <Loader2 className="fc-spinner" aria-hidden="true" />
                در حال محاسبه...
              </>
            ) : (
              t("calculate")
            )}
          </button>
        </form>

        {error && (
          <p className="fc-error" role="alert">{error}</p>
        )}

        {calculated && quotes.length === 0 && !error && (
          <p className="fc-no-results">{tCommon("noResults")}</p>
        )}

        {quotes.length > 0 && (
          <div className="fc-results">
            <p className="fc-results-label">{t("result")}</p>
            <div className="fc-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>{t("truckType")}</th>
                    <th>{t("delivery")}</th>
                    <th>{t("cost")}</th>
                    {onSelect && <th />}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote, i) => (
                    <tr key={`${quote.truckType}-${i}`}>
                      <td className="fc-td-bold">
                        {t(quote.truckType as Parameters<typeof t>[0])}
                      </td>
                      <td className="fc-td-muted">
                        {quote.estimatedDaysMin === quote.estimatedDaysMax
                          ? `${quote.estimatedDaysMin} ${tCommon("day")}`
                          : `${quote.estimatedDaysMin}–${quote.estimatedDaysMax} ${tCommon("day")}`}
                      </td>
                      <td className="fc-td-price">
                        {formatToman(quote.freightCost)}
                      </td>
                      {onSelect && (
                        <td>
                          <button
                            type="button"
                            onClick={() => onSelect(quote)}
                            className="fc-select-btn"
                          >
                            {t("select")}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fc-root {
          border-radius: var(--radius-xl); border: 1px solid var(--color-border);
          background-color: var(--color-surface); padding: 1.25rem;
        }
        .fc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
        .fc-header-icon { width: 1.25rem; height: 1.25rem; color: var(--color-accent); flex-shrink: 0; }
        .fc-header-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
        .fc-form { display: flex; flex-direction: column; gap: 1rem; }
        .fc-row { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
        @media (min-width: 640px) { .fc-row { grid-template-columns: repeat(3, 1fr); } }
        .fc-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .fc-label { font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); }
        .fc-input, .fc-select {
          width: 100%; padding: 0.5rem 0.75rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border); border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit; color: var(--color-text); outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .fc-input::placeholder { color: var(--color-text-muted); }
        .fc-input:focus, .fc-select:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
        }
        .fc-btn {
          display: inline-flex; align-items: center; gap: 0.375rem; align-self: flex-start;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.875rem; font-weight: 600; font-family: inherit;
          padding: 0.4375rem 1rem; border: none; border-radius: var(--radius-md);
          cursor: pointer; transition: background-color var(--transition-fast), opacity var(--transition-fast);
        }
        .fc-btn:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .fc-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .fc-spinner { width: 1rem; height: 1rem; animation: fc-spin 0.8s linear infinite; }
        @keyframes fc-spin { to { transform: rotate(360deg); } }
        .fc-error { margin-top: 0.75rem; font-size: 0.875rem; color: var(--color-danger); }
        .fc-no-results { margin-top: 0.75rem; font-size: 0.875rem; color: var(--color-text-muted); }
        .fc-results { margin-top: 1rem; }
        .fc-results-label { font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 0.5rem; }
        .fc-table-wrap { overflow-x: auto; }
        .fc-table { width: 100%; min-width: max-content; border-collapse: collapse; font-size: 0.875rem; }
        .fc-table th {
          padding: 0 0.75rem 0.5rem 0; text-align: start;
          font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .fc-table td { padding: 0.625rem 0.75rem 0.625rem 0; border-bottom: 1px solid var(--color-border-subtle); }
        .fc-table tbody tr:last-child td { border-bottom: none; }
        .fc-table tbody tr:hover td { background-color: var(--color-border-subtle); }
        .fc-td-bold  { font-weight: 500; color: var(--color-text); }
        .fc-td-muted { color: var(--color-text-secondary); }
        .fc-td-price { font-variant-numeric: tabular-nums; font-weight: 500; color: var(--color-text); }
        .fc-select-btn {
          font-size: 0.8125rem; font-weight: 500; font-family: inherit;
          background: none; border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 0.25rem 0.625rem;
          color: var(--color-accent); cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .fc-select-btn:hover { border-color: var(--color-accent); }
      `}</style>
    </>
  )
}
