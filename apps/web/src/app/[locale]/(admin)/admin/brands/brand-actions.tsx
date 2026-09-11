"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { adminDeleteBrandAction } from "@/actions/admin-brands"
import styles from "./Brands.module.css"

interface Props {
  brandId: string
  fa: boolean
  productCount: number
}

export default function BrandActions({ brandId, fa, productCount }: Props) {
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

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={styles["web-adm-brand__deleteBtn"]}
        title={fa ? "حذف" : "Delete"}
        aria-label={fa ? "حذف" : "Delete"}
      >
        <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
      </button>
      {error && <span className={styles["web-adm-brand__error"]} role="alert">{error}</span>}
    </>
  )
}
