"use client"

import React, { useState, useRef, useEffect } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { formatToman } from "@/lib/cement"
import { adminInlinePriceUpdateAction } from "@/actions/admin-prices"
import { useToast } from "./Toast"
import styles from "./InlinePriceCell.module.css"

interface InlinePriceCellProps {
  productId: string
  currentPrice: number
  locale: string
  fa: boolean
  onPriceUpdated?: (newPrice: number) => void
}

export function InlinePriceCell({
  productId,
  currentPrice,
  locale,
  fa,
  onPriceUpdated,
}: InlinePriceCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [price, setPrice] = useState(currentPrice)
  const [inputValue, setInputValue] = useState(String(currentPrice))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Sync state if currentPrice prop changes from parent
  useEffect(() => {
    setPrice(currentPrice)
    setInputValue(String(currentPrice))
  }, [currentPrice])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEditing = () => {
    if (isSaving) return
    setInputValue(String(price))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setInputValue(String(price))
  }

  const handleSave = async () => {
    if (isSaving) return
    const rawVal = inputValue.trim()
    const numVal = parseInt(rawVal, 10)

    if (isNaN(numVal) || numVal < 0) {
      toast.error(fa ? "قیمت نامعتبر است." : "Invalid price value.")
      handleCancel()
      return
    }

    if (numVal === price) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const res = await adminInlinePriceUpdateAction({
        productId,
        newPrice: numVal,
      })

      if (res && "error" in res && res.error) {
        toast.error(typeof res.error === "string" ? res.error : (fa ? "خطا در بروزرسانی قیمت" : "Failed to update price"))
        setInputValue(String(price))
      } else if (res && "data" in res && res.data) {
        setPrice(numVal)
        onPriceUpdated?.(numVal)
        toast.success(fa ? "قیمت با موفقیت بروزرسانی شد." : "Price updated successfully.")
      }
    } catch {
      toast.error(fa ? "خطای سیستمی در ثبت قیمت" : "System error updating price")
      setInputValue(String(price))
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      void handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div className={styles["ipc-container"]}>
      {isEditing ? (
        <div className={styles["ipc-form"]}>
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="1000"
            disabled={isSaving}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => void handleSave()}
            onKeyDown={handleKeyDown}
            className={styles["ipc-input"]}
            aria-label={fa ? "ویرایش قیمت" : "Edit price"}
          />
          {isSaving && (
            <Loader2
              className={styles["ipc-spinner"]}
              style={{ width: "1rem", height: "1rem" }}
            />
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleStartEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleStartEditing()
            }
          }}
          className={styles["ipc-display"]}
          title={fa ? "کلیک جهت ویرایش سریع قیمت" : "Click to quick edit price"}
        >
          <span className={styles["ipc-value"]}>
            {formatToman(price, locale as "fa" | "en")}
          </span>
          <Pencil
            className={styles["ipc-icon"]}
            style={{ width: "0.875rem", height: "0.875rem" }}
          />
        </div>
      )}
    </div>
  )
}
