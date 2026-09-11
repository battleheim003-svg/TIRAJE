"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { adminDeleteCategoryAction } from "@/actions/admin-categories"
import styles from "./Categories.module.css"

interface Props {
  categoryId: string
  fa: boolean
  productCount: number
  childCount: number
}

export default function CategoryActions({ categoryId, fa, productCount, childCount }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (productCount > 0) {
      setError(fa ? `این دسته در ${productCount} محصول استفاده شده است` : `Used in ${productCount} products`)
      return
    }
    if (childCount > 0) {
      setError(fa ? `این دسته دارای ${childCount} زیردسته است` : `Has ${childCount} subcategories`)
      return
    }
    if (!confirm(fa ? "این دسته‌بندی حذف شود؟" : "Delete this category?")) return

    setError(null)
    const fd = new FormData()
    fd.set("categoryId", categoryId)
    startTransition(async () => {
      try {
        await adminDeleteCategoryAction(fd)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در حذف" : "Delete failed"))
      }
    })
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={styles["web-adm-cat__deleteBtn"]}
        title={fa ? "حذف" : "Delete"}
      >
        <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
      </button>
      {error && (
        <span className={styles["web-adm-cat__error"]} role="alert">{error}</span>
      )}
    </>
  )
}
