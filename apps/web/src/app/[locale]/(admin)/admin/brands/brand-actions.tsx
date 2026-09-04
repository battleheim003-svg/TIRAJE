"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { adminDeleteBrandAction } from "@/actions/admin-brands"

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
      <button onClick={handleDelete} disabled={isPending} className="ba-btn" title={fa ? "حذف" : "Delete"}>
        <Trash2 size={14} />
      </button>
      {error && <span className="ba-error" role="alert">{error}</span>}
      <style>{`
        .ba-btn { display: inline-flex; align-items: center; justify-content: center; background: none; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-sm, 4px); padding: 0.25rem; cursor: pointer; transition: background-color var(--transition-fast); }
        .ba-btn:hover:not(:disabled) { background-color: var(--color-danger-subtle); }
        .ba-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ba-error { font-size: 0.75rem; color: var(--color-danger); max-width: 12rem; line-height: 1.3; }
      `}</style>
    </>
  )
}
