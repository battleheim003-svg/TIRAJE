"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminCreateCategoryAction, adminUpdateCategoryAction } from "@/actions/admin-categories"
interface Category { id: string; nameFa: string; nameEn: string | null }
interface EditCategory {
  id: string
  nameFa: string
  nameEn: string | null
  slug: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
}
interface Props {
  locale: string
  fa: boolean
  parents: Category[]
  category?: EditCategory
}
export default function CategoryForm({ locale, fa, parents, category }: Props) {
  const router = useRouter()
  const isEdit = !!category
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (isEdit) fd.set("categoryId", category!.id)
    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdateCategoryAction(fd)
          setSuccess(true)
        } else {
          const { categoryId } = await adminCreateCategoryAction(fd)
          router.push(`/${locale}/admin/categories/${categoryId}`)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی" : "Save failed"))
      }
    })
  }
  return (
    <>
      <form onSubmit={handleSubmit} className="cf-form">
        <div className="cf-row">
          <div className="cf-field cf-field--flex">
            <label className="cf-label" htmlFor="cf-nameFa">{fa ? "نام فارسی *" : "Name (FA) *"}</label>
            <input id="cf-nameFa" name="nameFa" type="text" required defaultValue={category?.nameFa ?? ""} className="cf-input" dir="rtl" />
          </div>
          <div className="cf-field cf-field--flex">
            <label className="cf-label" htmlFor="cf-nameEn">{fa ? "نام انگلیسی" : "Name (EN)"}</label>
            <input id="cf-nameEn" name="nameEn" type="text" defaultValue={category?.nameEn ?? ""} className="cf-input" dir="ltr" />
          </div>
        </div>
        <div className="cf-field">
          <label className="cf-label" htmlFor="cf-slug">{fa ? "اسلاگ *" : "Slug *"}</label>
          <input id="cf-slug" name="slug" type="text" required pattern="[a-z0-9-]+" defaultValue={category?.slug ?? ""} className="cf-input" dir="ltr" placeholder="category-slug" />
          <span className="cf-hint">{fa ? "فقط حروف لاتین کوچک، اعداد و خط تیره" : "Lowercase letters, numbers, hyphens only"}</span>
        </div>
        <div className="cf-row">
          <div className="cf-field cf-field--flex">
            <label className="cf-label" htmlFor="cf-parentId">{fa ? "دسته والد" : "Parent Category"}</label>
            <select id="cf-parentId" name="parentId" defaultValue={category?.parentId ?? ""} className="cf-select">
              <option value="">{fa ? "بدون والد (دسته ریشه)" : "None (root category)"}</option>
              {parents.filter((p) => p.id !== category?.id).map((p) => (
                <option key={p.id} value={p.id}>{fa ? p.nameFa : (p.nameEn ?? p.nameFa)}</option>
              ))}
            </select>
          </div>
          <div className="cf-field cf-field--small">
            <label className="cf-label" htmlFor="cf-sortOrder">{fa ? "ترتیب نمایش" : "Sort Order"}</label>
            <input id="cf-sortOrder" name="sortOrder" type="number" min={0} step={1} defaultValue={category?.sortOrder ?? 0} className="cf-input" dir="ltr" />
          </div>
        </div>
        <div className="cf-checks">
          <label className="cf-check">
            <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="cf-check__input" />
            <span>{fa ? "دسته‌بندی فعال" : "Active"}</span>
          </label>
        </div>
        {error && <p className="cf-error" role="alert">{error}</p>}
        {success && <p className="cf-success" role="status">{fa ? "با موفقیت ذخیره شد." : "Saved successfully."}</p>}
        <div className="cf-actions">
          <button type="submit" disabled={isPending} className="cf-submit">
            {isPending
              ? (fa ? "در حال ذخیره..." : "Saving...")
              : isEdit
                ? (fa ? "ذخیره تغییرات" : "Save Changes")
                : (fa ? "ایجاد دسته‌بندی" : "Create Category")}
          </button>
        </div>
      </form>
      <style>{`
        .cf-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cf-row { display: flex; flex-wrap: wrap; gap: 1rem; }
        .cf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cf-field--flex { flex: 1; min-width: 10rem; }
        .cf-field--small { width: 8rem; }
        .cf-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .cf-input, .cf-select {
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
        .cf-input:focus, .cf-select:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-subtle);
        }
        .cf-hint { font-size: 0.75rem; color: var(--color-text-muted); }
        .cf-checks { display: flex; gap: 1.25rem; flex-wrap: wrap; }
        .cf-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-secondary); cursor: pointer; user-select: none; }
        .cf-check__input { width: 1rem; height: 1rem; accent-color: var(--color-accent); cursor: pointer; }
        .cf-error { font-size: 0.875rem; color: var(--color-danger); background-color: var(--color-danger-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .cf-success { font-size: 0.875rem; color: var(--color-success); background-color: var(--color-success-subtle); border-radius: var(--radius-md); padding: 0.625rem 0.875rem; }
        .cf-actions { display: flex; justify-content: flex-end; }
        .cf-submit {
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
        .cf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .cf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}
