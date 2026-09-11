"use client"

import React, { useState, useRef } from "react"
import { X } from "lucide-react"
import { toHashtag } from "@tirajeh/integrations/telegram/hashtags"
import styles from "./TagInput.module.css"

export interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  normalize?: (tag: string) => string
  max?: number
  placeholder?: string
}

export function TagInput({
  value,
  onChange,
  normalize = toHashtag,
  max = 8,
  placeholder = "تایپ کنید و اینتر بزنید...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (text: string) => {
    const raw = text.trim()
    if (!raw) return
    const normalized = normalize(raw)
    if (!normalized) return

    // Prevent duplicates and respect max
    if (!value.includes(normalized) && value.length < max) {
      onChange([...value, normalized])
    }
    setInputValue("")
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag on backspace in empty input
      removeTag(value.length - 1)
    }
  }

  const handleBlur = () => {
    if (inputValue) {
      addTag(inputValue)
    }
  }

  return (
    <div
      className={styles.tagiContainer}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, idx) => (
        <span key={`${tag}-${idx}`} className={styles.tagiBadge}>
          {tag}
          <button
            type="button"
            className={styles.tagiRemoveBtn}
            onClick={(e) => {
              e.stopPropagation()
              removeTag(idx)
            }}
            aria-label={`حذف ${tag}`}
          >
            <X style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden="true" />
          </button>
        </span>
      ))}

      {value.length < max && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label="افزودن برچسب یا تگ جدید"
          className={styles.tagiInput}
        />
      )}
    </div>
  )
}
