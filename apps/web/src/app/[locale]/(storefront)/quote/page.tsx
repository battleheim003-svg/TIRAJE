import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { db } from "@tirajeh/database"
import { QuoteForm } from "./quote-form"

export const metadata: Metadata = {
  title: "درخواست قیمت | تیراژه",
  description: "درخواست قیمت عمده برای سیمان و مصالح ساختمانی از تیراژه",
}

async function getProducts() {
  return db.product.findMany({
    where: { isActive: true },
    select: { id: true, nameFa: true, nameEn: true },
    orderBy: { nameFa: "asc" },
  })
}

export default async function QuotePage() {
  const locale = await getLocale()
  const fa = locale === "fa"
  const products = await getProducts()

  return (
    <>
      <div className="qp-hero">
        <div className="qp-container">
          <p className="qp-eyebrow">{fa ? "خرید عمده" : "Bulk Orders"}</p>
          <h1 className="qp-title">
            {fa ? "درخواست قیمت" : "Request a Quote"}
          </h1>
          <p className="qp-sub">
            {fa
              ? "فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند."
              : "Complete the form below and our specialists will contact you promptly."}
          </p>
        </div>
      </div>

      <div className="qp-container qp-body">
        <QuoteForm products={products} locale={locale} />

        <div className="qp-aside">
          <div className="qp-info-card">
            <p className="qp-info-title">
              {fa ? "چرا از تیراژه خرید کنید؟" : "Why buy from Tirajeh?"}
            </p>
            <ul className="qp-info-list">
              {fa ? (
                <>
                  <li>گواهینامه استاندارد ملی ایران (ISIRI) برای تمام محصولات</li>
                  <li>تحویل به سراسر ایران با ناوگان اختصاصی</li>
                  <li>شرایط پرداخت اعتباری برای پیمانکاران دارای قرارداد</li>
                  <li>پشتیبانی فنی پیش و پس از فروش</li>
                </>
              ) : (
                <>
                  <li>ISIRI-certified products with factory lab reports</li>
                  <li>Nationwide delivery with dedicated fleet</li>
                  <li>Credit payment terms for contracted contractors</li>
                  <li>Technical support before and after sale</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .qp-container { max-width: 60rem; margin-inline: auto; padding-inline: 1.5rem; }
        .qp-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding-block: 3rem 2.5rem;
        }
        .qp-eyebrow {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-accent); margin-bottom: 0.625rem;
        }
        .qp-title {
          font-size: clamp(1.625rem, 4vw, 2.25rem); font-weight: 800;
          color: var(--color-text); letter-spacing: -0.025em; margin-bottom: 0.625rem;
        }
        .qp-sub { font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.65; max-width: 44ch; }

        .qp-body {
          padding-block: 2.5rem 4rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .qp-body { grid-template-columns: 1fr 18rem; align-items: start; }
        }

        .qp-info-card {
          padding: 1.25rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        .qp-info-title {
          font-size: 0.9375rem; font-weight: 700; color: var(--color-text);
          margin-bottom: 0.875rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .qp-info-list {
          margin: 0; padding-inline-start: 1.25rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .qp-info-list li { font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; }
      `}</style>
    </>
  )
}
