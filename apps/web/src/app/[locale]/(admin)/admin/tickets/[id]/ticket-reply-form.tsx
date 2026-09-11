"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { adminReplyTicketAction } from "@/actions/admin-tickets"
import { useToast } from "@/components/admin/Toast"
import styles from "./TicketDetail.module.css"

interface Props {
  ticketId: string
  currentStatus: string
  currentReplyText: string | null
  source: string
  telegramChatId: string | null
  fa: boolean
}

export default function TicketReplyForm({
  ticketId,
  currentStatus: _currentStatus,
  currentReplyText,
  source,
  telegramChatId,
  fa,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const fd = new FormData(e.currentTarget)
    fd.set("ticketId", ticketId)

    startTransition(async () => {
      try {
        await adminReplyTicketAction(fd)
        setSuccess(true)
        toast.success(
          fa
            ? "پاسخ شما با موفقیت ثبت و ارسال شد."
            : "Reply sent successfully."
        )
        router.refresh()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : fa ? "خطا در ارسال پاسخ" : "Failed to send reply"
        setError(msg)
        toast.error(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles["web-adm-tkt-d__form"]}>
      <div className={styles["web-adm-tkt-d__field"]}>
        <label className={styles["web-adm-tkt-d__label"]} htmlFor="trf-reply">
          {fa ? "متن پاسخ" : "Reply Message"}
          {source === "TELEGRAM" && telegramChatId && (
            <span style={{ marginInlineStart: "var(--space-2)", color: "#0284c7" }}>
              ({fa ? "به کاربر تلگرام ارسال می‌شود" : "Will be sent to Telegram user"})
            </span>
          )}
        </label>
        <textarea
          id="trf-reply"
          name="replyText"
          rows={4}
          required
          defaultValue={currentReplyText ?? ""}
          placeholder={fa ? "پاسخ خود را اینجا بنویسید..." : "Type your response here..."}
          className={styles["web-adm-tkt-d__textarea"]}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <button type="submit" disabled={isPending} className={styles["web-adm-tkt-d__btn"]}>
          <Send style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
          {isPending ? (fa ? "در حال ارسال..." : "Sending...") : (fa ? "ارسال پاسخ" : "Send Reply")}
        </button>
        {success && (
          <span className={styles["web-adm-tkt-d__success"]} role="status">
            {fa ? "پاسخ ثبت شد." : "Reply sent."}
          </span>
        )}
        {error && <span className={styles["web-adm-tkt-d__error"]} role="alert">{error}</span>}
      </div>
    </form>
  )
}
