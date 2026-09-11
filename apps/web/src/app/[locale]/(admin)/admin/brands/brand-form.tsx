"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminCreateBrandAction, adminUpdateBrandAction } from "@/actions/admin-brands"
import styles from "./Brands.module.css"

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
    <form onSubmit={handleSubmit} className={styles["web-adm-brand__form"]}>
      <div className={styles["web-adm-brand__formRow"]}>
        <div className={styles["web-adm-brand__field"]}>
          <label className={styles["web-adm-brand__label"]} htmlFor="bf-nameFa">{fa ? "نام فارسی *" : "Name (FA) *"}</label>
          <input id="bf-nameFa" name="nameFa" type="text" required defaultValue={brand?.nameFa ?? ""} className={styles["web-adm-brand__input"]} dir="rtl" />
        </div>
        <div className={styles["web-adm-brand__field"]}>
          <label className={styles["web-adm-brand__label"]} htmlFor="bf-nameEn">{fa ? "نام انگلیسی" : "Name (EN)"}</label>
          <input id="bf-nameEn" name="nameEn" type="text" defaultValue={brand?.nameEn ?? ""} className={styles["web-adm-brand__input"]} dir="ltr" />
        </div>
      </div>

      <div className={styles["web-adm-brand__formRow"]}>
        <div className={styles["web-adm-brand__field"]}>
          <label className={styles["web-adm-brand__label"]} htmlFor="bf-slug">{fa ? "اسلاگ *" : "Slug *"}</label>
          <input id="bf-slug" name="slug" type="text" required pattern="[a-z0-9-]+" defaultValue={brand?.slug ?? ""} className={styles["web-adm-brand__input"]} dir="ltr" placeholder="brand-slug" />
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{fa ? "فقط حروف لاتین کوچک، اعداد و خط تیره" : "Lowercase letters, numbers, hyphens only"}</span>
        </div>
        <div className={styles["web-adm-brand__field"]}>
          <label className={styles["web-adm-brand__label"]} htmlFor="bf-sortOrder">{fa ? "ترتیب" : "Order"}</label>
          <input id="bf-sortOrder" name="sortOrder" type="number" min={0} step={1} defaultValue={brand?.sortOrder ?? 0} className={styles["web-adm-brand__input"]} dir="ltr" />
        </div>
      </div>

      <div className={styles["web-adm-brand__fieldFull"]}>
        <label className={styles["web-adm-brand__label"]} htmlFor="bf-description">{fa ? "توضیحات" : "Description"}</label>
        <textarea id="bf-description" name="description" rows={3} defaultValue={brand?.description ?? ""} className={styles["web-adm-brand__textarea"]} />
      </div>

      <div className={styles["web-adm-brand__fieldCheckbox"]}>
        <input type="checkbox" id="bf-isActive" name="isActive" defaultChecked={brand?.isActive ?? true} className={styles["web-adm-brand__checkbox"]} />
        <label htmlFor="bf-isActive" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
          {fa ? "برند فعال" : "Active"}
        </label>
      </div>

      {error && <p className={styles["web-adm-brand__error"]} role="alert">{error}</p>}
      {success && <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-success-500)" }} role="status">{fa ? "با موفقیت ذخیره شد." : "Saved successfully."}</p>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={isPending} className={styles["web-adm-brand__submitBtn"]}>
          {isPending
            ? (fa ? "در حال ذخیره..." : "Saving...")
            : isEdit
              ? (fa ? "ذخیره تغییرات" : "Save Changes")
              : (fa ? "ایجاد برند" : "Create Brand")}
        </button>
      </div>
    </form>
  )
}
