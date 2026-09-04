"use client"

import { useState, useTransition } from "react"
import { useParams } from "next/navigation"
import { checkoutAction } from "@/actions/order"

const PROVINCES = [
  "تهران","اصفهان","خراسان رضوی","فارس","خوزستان","آذربایجان شرقی","آذربایجان غربی",
  "کرمان","مازندران","گیلان","سیستان و بلوچستان","لرستان","همدان","کرمانشاه","گلستان",
  "بوشهر","زنجان","سمنان","قزوین","قم","کردستان","مرکزی","هرمزگان","ایلام","چهارمحال و بختیاری",
  "خراسان شمالی","خراسان جنوبی","کهگیلویه و بویراحمد","اردبیل","البرز","یزد",
]

export default function CheckoutPage() {
  const { locale } = useParams<{ locale: string }>()
  const fa = locale === "fa"
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await checkoutAction(fd)
      if (result && !result.success) setError(result.error)
    })
  }

  return (
    <>
      <div className="co-root">
        <h1 className="co-title">{fa ? "تکمیل سفارش" : "Checkout"}</h1>

        <form onSubmit={handleSubmit} className="co-form">
          <section className="co-section">
            <h2 className="co-section__title">{fa ? "اطلاعات تحویل" : "Delivery Info"}</h2>

            <div className="co-row">
              <div className="co-field">
                <label className="co-label" htmlFor="co-name">
                  {fa ? "نام گیرنده *" : "Recipient Name *"}
                </label>
                <input id="co-name" name="recipientName" type="text" required className="co-input" />
              </div>
              <div className="co-field">
                <label className="co-label" htmlFor="co-phone">
                  {fa ? "شماره تماس *" : "Phone *"}
                </label>
                <input id="co-phone" name="phone" type="tel" required className="co-input" dir="ltr" placeholder="09xxxxxxxxx" />
              </div>
            </div>

            <div className="co-row">
              <div className="co-field">
                <label className="co-label" htmlFor="co-province">
                  {fa ? "استان *" : "Province *"}
                </label>
                <select id="co-province" name="province" required className="co-select">
                  <option value="">{fa ? "انتخاب استان..." : "Select..."}</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="co-field">
                <label className="co-label" htmlFor="co-city">
                  {fa ? "شهر *" : "City *"}
                </label>
                <input id="co-city" name="city" type="text" required className="co-input" />
              </div>
            </div>

            <div className="co-field">
              <label className="co-label" htmlFor="co-street">
                {fa ? "آدرس کامل *" : "Full Address *"}
              </label>
              <textarea id="co-street" name="street" required rows={3} className="co-textarea" />
            </div>

            <div className="co-field">
              <label className="co-label" htmlFor="co-postal">
                {fa ? "کد پستی" : "Postal Code"}
              </label>
              <input id="co-postal" name="postalCode" type="text" maxLength={10} className="co-input" dir="ltr" placeholder="XXXXXXXXXX" />
            </div>

            <div className="co-field">
              <label className="co-label" htmlFor="co-note">
                {fa ? "توضیحات سفارش" : "Order Note"}
              </label>
              <textarea id="co-note" name="note" rows={2} className="co-textarea" />
            </div>
          </section>

          {error && <p className="co-error" role="alert">{error}</p>}

          <button type="submit" disabled={isPending} className="co-submit">
            {isPending
              ? (fa ? "در حال ثبت سفارش..." : "Placing order...")
              : (fa ? "ثبت سفارش" : "Place Order")}
          </button>
        </form>
      </div>

      <style>{`
        .co-root { max-width: 42rem; margin: 0 auto; padding: 2rem 1rem; }
        .co-title { font-size: 1.5rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em; margin-bottom: 1.5rem; }
        .co-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .co-section { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .co-section__title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.25rem; }
        .co-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .co-field { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; min-width: 10rem; }
        .co-label { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-secondary); }
        .co-input, .co-select, .co-textarea {
          background-color: var(--color-background); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 0.5625rem 0.75rem;
          font-size: 0.875rem; color: var(--color-text); font-family: inherit;
          width: 100%; box-sizing: border-box; transition: border-color var(--transition-fast);
        }
        .co-input:focus, .co-select:focus, .co-textarea:focus {
          outline: none; border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
        }
        .co-textarea { resize: vertical; }
        .co-error { font-size: 0.875rem; color: var(--color-danger); background-color: var(--color-danger-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .co-submit {
          width: 100%; background-color: var(--color-accent); color: #fff;
          font-size: 1rem; font-weight: 700; padding: 0.75rem 1rem;
          border-radius: var(--radius-lg); border: none; cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .co-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .co-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
