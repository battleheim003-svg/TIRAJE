"use client"

import React, { useState } from "react"
import { LayoutDashboard, AlertCircle, RefreshCw } from "lucide-react"
import { canTransition } from "@tirajeh/shared"
import { formatToman, toFarsiDigits } from "@/lib/cement"
import { adminMoveOrderAction } from "@/actions/admin-orders"
import { useToast } from "./Toast"
import styles from "./KanbanBoard.module.css"

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export interface KanbanCard {
  id: string
  orderNumber: number | string
  status: OrderStatus
  totalAmount: number
  shippingTruckType: string | null
  shippingProvince: string | null
  totalWeightTon: number
  createdAt: string // ISO string
}

export interface KanbanBoardProps {
  initialCards: KanbanCard[]
  terminalCounts?: {
    CANCELLED: number
    REFUNDED: number
  }
  locale?: string
}

const ORDER_COLUMNS: OrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "در انتظار",
  AWAITING_PAYMENT: "منتظر پرداخت",
  CONFIRMED: "تأیید شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
  REFUNDED: "مسترد شده",
}

const STATUS_LABELS_EN: Record<OrderStatus, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting Payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

const TRUCK_LABELS: Record<string, string> = {
  PICKUP_3T: "وانت (۳ تن)",
  TRUCK_6T: "خاور (۶ تن)",
  TRUCK_10T: "تک (۱۰ تن)",
  TRAILER_22T: "جفت (۱۵ تن / ۲۲ تن)",
  TRAILER_30T: "تریلی (۳۰ تن)",
}

const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"]

export function KanbanBoard({
  initialCards,
  terminalCounts = { CANCELLED: 0, REFUNDED: 0 },
  locale = "fa",
}: KanbanBoardProps) {
  const fa = locale === "fa"
  const [cards, setCards] = useState<KanbanCard[]>(initialCards)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    e.dataTransfer.setData("cardId", card.id)
    e.dataTransfer.effectAllowed = "move"
    setDraggingId(card.id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, col: OrderStatus) => {
    const dragging = cards.find((c) => c.id === draggingId)
    if (!dragging) return

    if (canTransition(dragging.status, col)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (dragOverColumn !== col) {
        setDragOverColumn(col)
      }
    }
  }

  const handleDragLeave = (col: OrderStatus) => {
    if (dragOverColumn === col) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const cardId = e.dataTransfer.getData("cardId") || draggingId
    if (!cardId) return

    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    if (!canTransition(card.status, targetStatus)) {
      toast.error(
        fa
          ? `گذار از ${STATUS_LABELS[card.status]} به ${STATUS_LABELS[targetStatus]} مجاز نیست`
          : `Transition from ${card.status} to ${targetStatus} is not allowed`
      )
      return
    }

    const previousStatus = card.status

    // Optimistic UI update
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: targetStatus } : c))
    )
    setErrorMessage(null)

    try {
      const result = await adminMoveOrderAction({
        orderId: cardId,
        newStatus: targetStatus,
      })

      if (!result.ok) {
        // Rollback
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, status: previousStatus } : c))
        )
        const err = result.error || (fa ? "خطا در تغییر وضعیت سفارش" : "Error moving order")
        setErrorMessage(err)
        toast.error(err)
      } else {
        toast.success(
          fa
            ? `سفارش #${card.orderNumber} به «${STATUS_LABELS[targetStatus]}» منتقل شد.`
            : `Order #${card.orderNumber} moved to ${STATUS_LABELS_EN[targetStatus]}.`
        )
      }
    } catch {
      // Rollback on network/fatal exception
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: previousStatus } : c))
      )
      const err = fa ? "خطای سیستمی در جابه‌جایی سفارش" : "System error moving order"
      setErrorMessage(err)
      toast.error(err)
    } finally {
      setDraggingId(null)
    }
  }

  return (
    <div className={styles["kb-container"]}>
      {/* Header */}
      <div className={styles["kb-header"]}>
        <div className={styles["kb-titleSection"]}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
              color: "var(--color-accent-text)",
            }}
          >
            <LayoutDashboard style={{ width: "1.25rem", height: "1.25rem" }} />
          </div>
          <div>
            <h1 className={styles["kb-title"]}>
              {fa ? "برد کانبان سفارش‌ها" : "Orders Kanban Board"}
            </h1>
            <p className={styles["kb-desc"]}>
              {fa
                ? "مدیریت جریان سفارش‌ها با جابه‌جایی سریع و رعایت قوانین گذار مجاز"
                : "Manage orders flow via drag and drop with state transition validation"}
            </p>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className={styles["kb-errorBanner"]}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: "var(--font-size-xs)",
              textDecoration: "underline",
            }}
          >
            {fa ? "بستن" : "Dismiss"}
          </button>
        </div>
      )}

      {/* Columns Board */}
      <div className={styles["kb-board"]}>
        {ORDER_COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.status === col)
          const isTerminal = TERMINAL_STATUSES.includes(col)
          const isOver = dragOverColumn === col
          const count = isTerminal
            ? colCards.length > 0
              ? colCards.length
              : terminalCounts[col as "CANCELLED" | "REFUNDED"] ?? 0
            : colCards.length

          return (
            <div
              key={col}
              onDragOver={(e) => handleDragOver(e, col)}
              onDragLeave={() => handleDragLeave(col)}
              onDrop={(e) => handleDrop(e, col)}
              className={[
                styles["kb-column"],
                isTerminal ? styles["kb-column--terminal"] : "",
                isOver ? styles["kb-column--dragOver"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Column Header */}
              <div className={styles["kb-columnHeader"]}>
                <span className={styles["kb-columnTitle"]}>
                  {fa ? STATUS_LABELS[col] : STATUS_LABELS_EN[col]}
                </span>
                <span className={styles["kb-columnBadge"]}>
                  {fa ? toFarsiDigits(count) : count}
                </span>
              </div>

              {/* Cards List */}
              <div className={styles["kb-columnCards"]}>
                {colCards.length === 0 ? (
                  <div className={styles["kb-emptyState"]}>
                    {fa ? "بدون سفارش" : "No orders"}
                  </div>
                ) : (
                  colCards.map((card) => {
                    const isDragging = draggingId === card.id
                    return (
                      <div
                        key={card.id}
                        draggable={!isTerminal}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDragEnd={handleDragEnd}
                        className={[
                          styles["kb-card"],
                          isDragging ? styles["kb-card--dragging"] : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className={styles["kb-cardHeader"]}>
                          <span className={styles["kb-card-number"]}>
                            #{card.orderNumber}
                          </span>
                          <span className={styles["kb-card-date"]}>
                            {new Date(card.createdAt).toLocaleDateString(
                              fa ? "fa-IR" : "en-US",
                              { month: "numeric", day: "numeric" }
                            )}
                          </span>
                        </div>

                        <div className={styles["kb-card-meta"]}>
                          {card.totalWeightTon > 0 && (
                            <span className={styles["kb-card-tag"]}>
                              {fa
                                ? toFarsiDigits(card.totalWeightTon.toFixed(1))
                                : card.totalWeightTon.toFixed(1)}{" "}
                              {fa ? "تن" : "t"}
                            </span>
                          )}
                          {card.shippingProvince && (
                            <span className={styles["kb-card-tag"]}>
                              {card.shippingProvince}
                            </span>
                          )}
                          {card.shippingTruckType && (
                            <span className={styles["kb-card-tag"]}>
                              {TRUCK_LABELS[card.shippingTruckType] ??
                                card.shippingTruckType}
                            </span>
                          )}
                        </div>

                        <div className={styles["kb-card-amount"]}>
                          {formatToman(card.totalAmount, fa ? "fa" : "en")}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
