"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminCreateCategoryAction, adminUpdateCategoryAction } from "@/actions/admin-categories"
import styles from "./Categories.module.css"

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
    <form onSubmit={handleSubmit} className={styles["web-adm-cat__form"]}>
      <div className={styles["web-adm-cat__formRow"]}>
        <div className={styles["web-adm-cat__field"]}>
          <label className={styles["web-adm-cat__label"]} htmlFor="cf-nameFa">
            {fa ? "نام فارسی *" : "Name (FA) *"}
          </label>
          <input
            id="cf-nameFa"
            name="nameFa"
            type="text"
            required
            defaultValue={category?.nameFa ?? ""}
            className={styles["web-adm-cat__input"]}
            dir="rtl"
          />
        </div>
        <div className={styles["web-adm-cat__field"]}>
          <label className={styles["web-adm-cat__label"]} htmlFor="cf-nameEn">
            {fa ? "نام انگلیسی" : "Name (EN)"}
          </label>
          <input
            id="cf-nameEn"
            name="nameEn"
            type="text"
            defaultValue={category?.nameEn ?? ""}
            className={styles["web-adm-cat__input"]}
            dir="ltr"
          />
        </div>
      </div>

      <div className={styles["web-adm-cat__fieldFull"]}>
        <label className={styles["web-adm-cat__label"]} htmlFor="cf-slug">
          {fa ? "اسلاگ *" : "Slug *"}
        </label>
        <input
          id="cf-slug"
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          defaultValue={category?.slug ?? ""}
          className={styles["web-adm-cat__input"]}
          dir="ltr"
          placeholder="category-slug"
        />
        <span className={styles["web-adm-cat__slug"]}>
          {fa ? "فقط حروف لاتین کوچک، اعداد و خط تیره" : "Lowercase letters, numbers, hyphens only"}
        </span>
      </div>

      <div className={styles["web-adm-cat__formRow"]}>
        <div className={styles["web-adm-cat__field"]}>
          <label className={styles["web-adm-cat__label"]} htmlFor="cf-parentId">
            {fa ? "دسته والد" : "Parent Category"}
          </label>
          <select
            id="cf-parentId"
            name="parentId"
            defaultValue={category?.parentId ?? ""}
            className={styles["web-adm-cat__select"]}
          >
            <option value="">{fa ? "بدون والد (دسته ریشه)" : "None (root category)"}</option>
            {parents
              .filter((p) => p.id !== category?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {fa ? p.nameFa : (p.nameEn ?? p.nameFa)}
                </option>
              ))}
          </select>
        </div>
        <div className={styles["web-adm-cat__field"]}>
          <label className={styles["web-adm-cat__label"]} htmlFor="cf-sortOrder">
            {fa ? "ترتیب نمایش" : "Sort Order"}
          </label>
          <input
            id="cf-sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            step={1}
            defaultValue={category?.sortOrder ?? 0}
            className={styles["web-adm-cat__input"]}
            dir="ltr"
          />
        </div>
      </div>

      <div className={styles["web-adm-cat__fieldCheckbox"]}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category?.isActive ?? true}
            className={styles["web-adm-cat__checkbox"]}
            aria-label={fa ? "دسته‌بندی فعال" : "Active category"}
          />
          <span>{fa ? "دسته‌بندی فعال" : "Active"}</span>
        </label>
      </div>

      {error && <p className={styles["web-adm-cat__error"]} role="alert">{error}</p>}
      {success && (
        <p style={{ color: "var(--color-success)", fontSize: "var(--font-size-sm)", margin: 0 }} role="status">
          {fa ? "با موفقیت ذخیره شد." : "Saved successfully."}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={styles["web-adm-cat__submitBtn"]}
      >
        {isPending
          ? (fa ? "در حال ذخیره..." : "Saving...")
          : isEdit
            ? (fa ? "ذخیره تغییرات" : "Save Changes")
            : (fa ? "ایجاد دسته‌بندی" : "Create Category")}
      </button>
    </form>
  )
}
