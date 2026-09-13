"use client"

import { useState, useTransition } from "react"
import { Trash2, RotateCcw } from "lucide-react"
import { adminDeletePostAction, adminRestorePostAction } from "@/actions/admin-blog"
import styles from "./BlogList.module.css"

interface Props {
  postId: string
  fa: boolean
  isArchived?: boolean
}

export default function PostActions({ postId, fa, isArchived }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(fa ? "این مقاله حذف شود؟" : "Delete this post?")) return

    setError(null)
    const fd = new FormData()
    fd.set("id", postId)
    startTransition(async () => {
      try {
        await adminDeletePostAction(fd)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در حذف" : "Delete failed"))
      }
    })
  }

  function handleRestore() {
    if (!confirm(fa ? "این مقاله بازگردانی شود؟" : "Restore this post?")) return

    setError(null)
    const fd = new FormData()
    fd.set("id", postId)
    startTransition(async () => {
      try {
        await adminRestorePostAction(fd)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : (fa ? "خطا در بازگردانی" : "Restore failed"))
      }
    })
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      {isArchived ? (
        <button
          onClick={handleRestore}
          disabled={isPending}
          className={styles["web-adm-blg__editBtn"]}
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
          style={{
            background: "none",
            border: "none",
            padding: "0.25rem",
            color: "var(--color-danger, #ef4444)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
          title={fa ? "حذف" : "Delete"}
          aria-label={fa ? "حذف" : "Delete"}
        >
          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
        </button>
      )}
      {error && <span style={{ color: "var(--color-danger, #ef4444)", fontSize: "0.75rem" }} role="alert">{error}</span>}
    </div>
  )
}
