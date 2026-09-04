import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { FreightCalculator } from "@/components/products/freight-calculator"

export const metadata: Metadata = {
  title: "محاسبه هزینه حمل | تیراژه",
  description: "محاسبه آنلاین هزینه حمل‌ونقل سیمان و مصالح ساختمانی به سراسر ایران",
}

export default async function FreightPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  return (
    <>
      <div className="fr-hero">
        <div className="fr-container">
          <p className="fr-eyebrow">{fa ? "ابزار محاسبه" : "Calculator"}</p>
          <h1 className="fr-title">
            {fa ? "محاسبه هزینه حمل" : "Freight Cost Calculator"}
          </h1>
          <p className="fr-sub">
            {fa
              ? "هزینه حمل‌ونقل کالا را بر اساس استان مقصد و وزن محموله محاسبه کنید."
              : "Calculate shipping costs based on destination province and cargo weight."}
          </p>
        </div>
      </div>

      <div className="fr-container fr-body">
        <FreightCalculator />

        <div className="fr-note">
          <p className="fr-note-title">
            {fa ? "توجه" : "Note"}
          </p>
          <ul className="fr-note-list">
            {fa ? (
              <>
                <li>قیمت‌های نمایش‌داده‌شده تخمینی هستند و ممکن است در زمان تأیید سفارش متفاوت باشند.</li>
                <li>هزینه نهایی حمل در فاکتور رسمی درج می‌شود.</li>
                <li>برای محموله‌های بیش از ۲۶ تن یا شرایط خاص، با تیم فروش تماس بگیرید.</li>
              </>
            ) : (
              <>
                <li>Displayed prices are estimates and may differ at order confirmation.</li>
                <li>Final freight cost is stated in the official invoice.</li>
                <li>For loads over 26 tons or special conditions, contact our sales team.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <style>{`
        .fr-container { max-width: 52rem; margin-inline: auto; padding-inline: 1.5rem; }
        .fr-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding-block: 3rem 2.5rem;
        }
        .fr-eyebrow {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-accent); margin-bottom: 0.625rem;
        }
        .fr-title {
          font-size: clamp(1.625rem, 4vw, 2.25rem); font-weight: 800;
          color: var(--color-text); letter-spacing: -0.025em; margin-bottom: 0.625rem;
        }
        .fr-sub { font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.65; max-width: 42ch; }

        .fr-body { padding-block: 2.5rem 4rem; display: flex; flex-direction: column; gap: 1.5rem; }

        .fr-note {
          padding: 1rem 1.25rem;
          background-color: color-mix(in srgb, var(--color-accent) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
          border-radius: var(--radius-lg);
        }
        .fr-note-title {
          font-size: 0.8125rem; font-weight: 700; color: var(--color-accent);
          margin-bottom: 0.5rem;
        }
        .fr-note-list {
          margin: 0; padding-inline-start: 1.25rem;
          display: flex; flex-direction: column; gap: 0.3rem;
        }
        .fr-note-list li { font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; }
      `}</style>
    </>
  )
}
