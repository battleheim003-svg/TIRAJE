"use client"

import { useState, useTransition } from "react"
import { Trash2, RotateCcw } from "lucide-react"
import { adminDeleteBrandAction, adminRestoreBrandAction } from "@/actions/admin-brands"
import styles from "./Brands.module.css"

interface Props {
  brandId: string
  fa: boolean
  productCount: number
  isArchived?: boolean
}

export default function BrandActions({ brandId, fa, productCount, isArchived }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (productCount > 0) {
      setError(fa ? `این برند در ${productCount} محصول استفاده شده است` : `Used in ${productCount} products`)
      return
    }
    if (!confirm(fa ? "این برند حذف شود؟" : "Delete this brand?")) return

    setError(null)
    const fd = new FormData()
    fd.set("brandId", brandId)
    startTransition(async () => {
      try {
        await adminDeleteBrandAction(fd)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در حذف" : "Delete failed"))
      }
    })
  }

  function handleRestore() {
    if (!confirm(fa ? "این برند بازگردانی شود؟" : "Restore this brand?")) return

    setError(null)
    const fd = new FormData()
    fd.set("brandId", brandId)
    startTransition(async () => {
      try {
        await adminRestoreBrandAction(fd)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در بازگردانی" : "Restore failed"))
      }
    })
  }

  return (
    <>
      {isArchived ? (
        <button
          onClick={handleRestore}
          disabled={isPending}
          className={styles["web-adm-brand__editBtn"]}
          title={fa ? "بازگردانی" : "Restore"}
          aria-label={fa ? "بازگردانی" : "Restore"}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}
        >
          <RotateCcw style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
          {fa ? "بازگردانی" : "Restore"}
        </button>
      ) : (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className={styles["web-adm-brand__deleteBtn"]}
          title={fa ? "حذف" : "Delete"}
          aria-label={fa ? "حذف" : "Delete"}
        >
          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
        </button>
      )}
      {error && <span className={styles["web-adm-brand__error"]} role="alert">{error}</span>}
    </>
  )
}
