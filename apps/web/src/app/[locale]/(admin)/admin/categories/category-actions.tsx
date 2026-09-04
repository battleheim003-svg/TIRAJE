"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { adminDeleteCategoryAction } from "@/actions/admin-categories"

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
        className="ca-delete-btn"
        title={fa ? "حذف" : "Delete"}
      >
        <Trash2 size={14} />
      </button>
      {error && (
        <span className="ca-error" role="alert">{error}</span>
      )}
      <style>{`
        .ca-delete-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid var(--color-danger);
          color: var(--color-danger);
          border-radius: var(--radius-sm, 4px);
          padding: 0.25rem;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .ca-delete-btn:hover:not(:disabled) { background-color: var(--color-danger-subtle); }
        .ca-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ca-error {
          font-size: 0.75rem;
          color: var(--color-danger);
          max-width: 12rem;
          line-height: 1.3;
        }
      `}</style>
    </>
  )
}
