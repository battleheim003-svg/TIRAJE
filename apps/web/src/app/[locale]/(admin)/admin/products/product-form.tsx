"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
} from "@/lib/cement"
import { adminCreateProductAction, adminUpdateProductAction } from "@/actions/admin-products"

interface Brand { id: string; nameFa: string; nameEn: string | null }
interface Factory { id: string; nameFa: string; nameEn: string | null; city: string; province: string }

interface Product {
  id: string
  nameFa: string
  nameEn: string | null
  slug: string
  brandId: string
  cementType: string | null
  packagingType: string
  weightKg: number | string
  price: number | string
  comparePrice: number | string | null
  stockStatus: string
  stockQty: number
  minOrderQty: number
  factoryId: string | null
  isActive: boolean
  isFeatured: boolean
  descriptionFa: string | null
  descriptionEn: string | null
}

interface Props {
  locale: string
  fa: boolean
  brands: Brand[]
  factories: Factory[]
  product?: Product
}

const CEMENT_TYPES = Object.entries(CEMENT_TYPE_LABEL)
const PACKAGING_TYPES = Object.entries(PACKAGING_LABEL)
const STOCK_STATUSES = Object.entries(STOCK_LABEL)

export default function ProductForm({ locale, fa, brands, factories, product }: Props) {
  const router = useRouter()
  const isEdit = !!product
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (isEdit) fd.set("productId", product!.id)

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdateProductAction(fd)
          setSuccess(true)
        } else {
          const { productId } = await adminCreateProductAction(fd)
          router.push(`/${locale}/admin/products/${productId}`)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی" : "Save failed"))
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="pf-form">
        {/* Row: names */}
        <div className="pf-row">
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-nameFa">
              {fa ? "نام فارسی *" : "Name (FA) *"}
            </label>
            <input
              id="pf-nameFa"
              name="nameFa"
              type="text"
              required
              defaultValue={product?.nameFa ?? ""}
              className="pf-input"
              dir="rtl"
            />
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-nameEn">
              {fa ? "نام انگلیسی" : "Name (EN)"}
            </label>
            <input
              id="pf-nameEn"
              name="nameEn"
              type="text"
              defaultValue={product?.nameEn ?? ""}
              className="pf-input"
              dir="ltr"
            />
          </div>
        </div>

        {/* Slug */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-slug">
            {fa ? "اسلاگ (URL) *" : "Slug *"}
          </label>
          <input
            id="pf-slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            defaultValue={product?.slug ?? ""}
            className="pf-input"
            dir="ltr"
            placeholder="product-slug-en"
          />
          <span className="pf-hint">{fa ? "فقط حروف لاتین کوچک، اعداد و خط تیره" : "Lowercase letters, numbers, hyphens only"}</span>
        </div>

        {/* Brand + Factory */}
        <div className="pf-row">
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-brandId">
              {fa ? "برند *" : "Brand *"}
            </label>
            <select id="pf-brandId" name="brandId" required defaultValue={product?.brandId ?? ""} className="pf-select">
              <option value="">{fa ? "انتخاب برند..." : "Select brand..."}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {fa ? b.nameFa : (b.nameEn ?? b.nameFa)}
                </option>
              ))}
            </select>
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-factoryId">
              {fa ? "کارخانه" : "Factory"}
            </label>
            <select id="pf-factoryId" name="factoryId" defaultValue={product?.factoryId ?? ""} className="pf-select">
              <option value="">{fa ? "بدون کارخانه" : "None"}</option>
              {factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {fa ? f.nameFa : (f.nameEn ?? f.nameFa)} — {f.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cement type + Packaging */}
        <div className="pf-row">
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-cementType">
              {fa ? "نوع سیمان" : "Cement Type"}
            </label>
            <select id="pf-cementType" name="cementType" defaultValue={product?.cementType ?? ""} className="pf-select">
              <option value="">{fa ? "بدون نوع" : "None"}</option>
              {CEMENT_TYPES.map(([key, label]) => (
                <option key={key} value={key}>{fa ? label.fa : label.en}</option>
              ))}
            </select>
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-packagingType">
              {fa ? "نوع بسته‌بندی *" : "Packaging *"}
            </label>
            <select id="pf-packagingType" name="packagingType" required defaultValue={product?.packagingType ?? ""} className="pf-select">
              <option value="">{fa ? "انتخاب..." : "Select..."}</option>
              {PACKAGING_TYPES.map(([key, label]) => (
                <option key={key} value={key}>{fa ? label.fa : label.en}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price + Compare + Weight */}
        <div className="pf-row">
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-price">
              {fa ? "قیمت (تومان) *" : "Price (Toman) *"}
            </label>
            <input
              id="pf-price"
              name="price"
              type="number"
              required
              min={0}
              step={1}
              defaultValue={product?.price !== undefined ? String(product.price) : ""}
              className="pf-input"
              dir="ltr"
            />
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-comparePrice">
              {fa ? "قیمت مقایسه" : "Compare Price"}
            </label>
            <input
              id="pf-comparePrice"
              name="comparePrice"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.comparePrice != null ? String(product.comparePrice) : ""}
              className="pf-input"
              dir="ltr"
            />
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-weightKg">
              {fa ? "وزن (کیلوگرم) *" : "Weight (kg) *"}
            </label>
            <input
              id="pf-weightKg"
              name="weightKg"
              type="number"
              required
              min={0.01}
              step={0.01}
              defaultValue={product?.weightKg !== undefined ? String(product.weightKg) : ""}
              className="pf-input"
              dir="ltr"
            />
          </div>
        </div>

        {/* Stock */}
        <div className="pf-row">
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-stockStatus">
              {fa ? "وضعیت موجودی *" : "Stock Status *"}
            </label>
            <select id="pf-stockStatus" name="stockStatus" required defaultValue={product?.stockStatus ?? "IN_STOCK"} className="pf-select">
              {STOCK_STATUSES.map(([key, label]) => (
                <option key={key} value={key}>{fa ? label.fa : label.en}</option>
              ))}
            </select>
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-stockQty">
              {fa ? "تعداد موجودی" : "Stock Qty"}
            </label>
            <input
              id="pf-stockQty"
              name="stockQty"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.stockQty ?? 0}
              className="pf-input"
              dir="ltr"
            />
          </div>
          <div className="pf-field pf-field--flex">
            <label className="pf-label" htmlFor="pf-minOrderQty">
              {fa ? "حداقل سفارش" : "Min Order Qty"}
            </label>
            <input
              id="pf-minOrderQty"
              name="minOrderQty"
              type="number"
              min={1}
              step={1}
              defaultValue={product?.minOrderQty ?? 1}
              className="pf-input"
              dir="ltr"
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-descriptionFa">
            {fa ? "توضیحات فارسی" : "Description (FA)"}
          </label>
          <textarea
            id="pf-descriptionFa"
            name="descriptionFa"
            rows={4}
            defaultValue={product?.descriptionFa ?? ""}
            className="pf-textarea"
            dir="rtl"
          />
        </div>
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-descriptionEn">
            {fa ? "توضیحات انگلیسی" : "Description (EN)"}
          </label>
          <textarea
            id="pf-descriptionEn"
            name="descriptionEn"
            rows={4}
            defaultValue={product?.descriptionEn ?? ""}
            className="pf-textarea"
            dir="ltr"
          />
        </div>

        {/* Toggles */}
        <div className="pf-checks">
          <label className="pf-check">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="pf-check__input"
            />
            <span>{fa ? "محصول فعال" : "Active"}</span>
          </label>
          <label className="pf-check">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className="pf-check__input"
            />
            <span>{fa ? "محصول ویژه" : "Featured"}</span>
          </label>
        </div>

        {/* Feedback */}
        {error && <p className="pf-error" role="alert">{error}</p>}
        {success && (
          <p className="pf-success" role="status">
            {fa ? "محصول با موفقیت به‌روزرسانی شد." : "Product updated successfully."}
          </p>
        )}

        {/* Submit */}
        <div className="pf-actions">
          <button type="submit" disabled={isPending} className="pf-submit">
            {isPending
              ? (fa ? "در حال ذخیره..." : "Saving...")
              : isEdit
                ? (fa ? "ذخیره تغییرات" : "Save Changes")
                : (fa ? "ایجاد محصول" : "Create Product")}
          </button>
        </div>
      </form>

      <style>{`
        .pf-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pf-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .pf-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .pf-field--flex { flex: 1; min-width: 10rem; }
        .pf-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pf-input, .pf-select, .pf-textarea {
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.5625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
        }
        .pf-input::placeholder, .pf-textarea::placeholder { color: var(--color-text-muted); }
        .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
        }
        .pf-textarea { resize: vertical; }
        .pf-hint { font-size: 0.75rem; color: var(--color-text-muted); }

        .pf-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
        }
        .pf-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          cursor: pointer;
          user-select: none;
        }
        .pf-check__input {
          width: 1rem;
          height: 1rem;
          accent-color: var(--color-accent);
          cursor: pointer;
        }

        .pf-error {
          font-size: 0.875rem;
          color: var(--color-danger);
          background-color: var(--color-danger-subtle);
          border-radius: var(--radius-md);
          padding: 0.625rem 0.875rem;
        }
        .pf-success {
          font-size: 0.875rem;
          color: var(--color-success);
          background-color: var(--color-success-subtle);
          border-radius: var(--radius-md);
          padding: 0.625rem 0.875rem;
        }

        .pf-actions { display: flex; justify-content: flex-end; }
        .pf-submit {
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.625rem 1.75rem;
          border-radius: var(--radius-lg);
          border: none;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .pf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .pf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .pf-submit:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
      `}</style>
    </>
  )
}
