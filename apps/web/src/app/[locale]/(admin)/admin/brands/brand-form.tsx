"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminCreateBrandAction, adminUpdateBrandAction } from "@/actions/admin-brands"

interface EditBrand {
  id: string
  nameFa: string
  nameEn: string | null
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

interface Props {
  locale: string
  fa: boolean
  brand?: EditBrand
}

export default function BrandForm({ locale, fa, brand }: Props) {
  const router = useRouter()
  const isEdit = !!brand
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (isEdit) fd.set("brandId", brand!.id)

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdateBrandAction(fd)
          setSuccess(true)
        } else {
          const { brandId } = await adminCreateBrandAction(fd)
          router.push(`/${locale}/admin/brands/${brandId}`)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی" : "Save failed"))
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="bf-form">
        <div className="bf-row">
          <div className="bf-field bf-field--flex">
            <label className="bf-label" htmlFor="bf-nameFa">{fa ? "نام فارسی *" : "Name (FA) *"}</label>
            <input id="bf-nameFa" name="nameFa" type="text" required defaultValue={brand?.nameFa ?? ""} className="bf-input" dir="rtl" />
          </div>
          <div className="bf-field bf-field--flex">
            <label className="bf-label" htmlFor="bf-nameEn">{fa ? "نام انگلیسی" : "Name (EN)"}</label>
            <input id="bf-nameEn" name="nameEn" type="text" defaultValue={brand?.nameEn ?? ""} className="bf-input" dir="ltr" />
          </div>
        </div>

        <div className="bf-row">
          <div className="bf-field bf-field--flex">
            <label className="bf-label" htmlFor="bf-slug">{fa ? "اسلاگ *" : "Slug *"}</label>
            <input id="bf-slug" name="slug" type="text" required pattern="[a-z0-9-]+" defaultValue={brand?.slug ?? ""} className="bf-input" dir="ltr" placeholder="brand-slug" />
            <span className="bf-hint">{fa ? "فقط حروف لاتین کوچک، اعداد و خط تیره" : "Lowercase letters, numbers, hyphens only"}</span>
          </div>
          <div className="bf-field bf-field--small">
            <label className="bf-label" htmlFor="bf-sortOrder">{fa ? "ترتیب" : "Order"}</label>
            <input id="bf-sortOrder" name="sortOrder" type="number" min={0} step={1} defaultValue={brand?.sortOrder ?? 0} className="bf-input" dir="ltr" />
          </div>
        </div>

        <div className="bf-field">
          <label className="bf-label" htmlFor="bf-description">{fa ? "توضیحات" : "Description"}</label>
          <textarea id="bf-description" name="description" rows={3} defaultValue={brand?.description ?? ""} className="bf-textarea" />
        </div>

        <div className="bf-checks">
          <label className="bf-check">
            <input type="checkbox" name="isActive" defaultChecked={brand?.isActive ?? true} className="bf-check__input" />
            <span>{fa ? "برند فعال" : "Active"}</span>
          </label>
        </div>

        {error && <p className="bf-error" role="alert">{error}</p>}
        {success && <p className="bf-success" role="status">{fa ? "با موفقیت ذخیره شد." : "Saved successfully."}</p>}

        <div className="bf-actions">
          <button type="submit" disabled={isPending} className="bf-submit">
            {isPending
              ? (fa ? "در حال ذخیره..." : "Saving...")
              : isEdit
                ? (fa ? "ذخیره تغییرات" : "Save Changes")
                : (fa ? "ایجاد برند" : "Create Brand")}
          </button>
        </div>
      </form>

      <style>{`
        .bf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .bf-row { display: flex; flex-wrap: wrap; gap: 1rem; }
        .bf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .bf-field--flex { flex: 1; min-width: 10rem; }
        .bf-field--small { width: 8rem; }
        .bf-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .bf-input, .bf-textarea {
          background-color: var(--color-background); border: 1px solid var(--color-border);
          border-radius: var(--radius-md); padding: 0.5625rem 0.75rem; font-size: 0.875rem;
          color: var(--color-text); transition: border-color var(--transition-fast);
          font-family: inherit; width: 100%; box-sizing: border-box;
        }
        .bf-input:focus, .bf-textarea:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent); }
        .bf-textarea { resize: vertical; }
        .bf-hint { font-size: 0.75rem; color: var(--color-text-muted); }
        .bf-checks { display: flex; gap: 1.25rem; flex-wrap: wrap; }
        .bf-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-secondary); cursor: pointer; user-select: none; }
        .bf-check__input { width: 1rem; height: 1rem; accent-color: var(--color-accent); cursor: pointer; }
        .bf-error { font-size: 0.875rem; color: var(--color-danger); background-color: var(--color-danger-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .bf-success { font-size: 0.875rem; color: var(--color-success); background-color: var(--color-success-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .bf-actions { display: flex; justify-content: flex-end; }
        .bf-submit { background-color: var(--color-accent); color: #fff; font-size: 0.9375rem; font-weight: 700; padding: 0.625rem 1.75rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: background-color var(--transition-fast); }
        .bf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .bf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
