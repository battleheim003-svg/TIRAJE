"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, X } from "lucide-react"
import styles from "./ImageUploadDropzone.module.css"

interface ImageUploadDropzoneProps {
  name: string
  value?: string | null
  onChange: (dataUrlOrUrl: string | null) => void
  label?: string
  hint?: string
}

export function ImageUploadDropzone({
  name,
  value,
  onChange,
  label = "تصویر شاخص",
  hint = "فایل تصویری را بکشید یا برای انتخاب کلیک کنید (PNG, JPG, WebP)",
}: ImageUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file || !file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={styles.dzContainer}>
      {/* Hidden input storing the value for standard FormData submission if needed */}
      <input type="hidden" name={name} value={value ?? ""} />

      {value ? (
        <div className={styles.dzPreviewCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className={styles.dzPreviewImg} />
          <button
            type="button"
            className={styles.dzRemoveBtn}
            onClick={() => {
              onChange(null)
              if (fileInputRef.current) fileInputRef.current.value = ""
            }}
            title="حذف تصویر"
            aria-label="حذف تصویر"
          >
            <X style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          className={`${styles.dzDropArea} ${dragActive ? styles.dzDropAreaActive : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.dzHiddenInput}
            onChange={(e) => handleFiles(e.target.files)}
            aria-label={label}
          />
          <div className={styles.dzIconWrap}>
            <UploadCloud style={{ width: "1.75rem", height: "1.75rem" }} aria-hidden="true" />
          </div>
          <p className={styles.dzTextMain}>{label}</p>
          <p className={styles.dzTextSub}>{hint}</p>
        </div>
      )}
    </div>
  )
}
