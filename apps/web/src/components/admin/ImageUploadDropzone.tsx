"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, X, Loader2, AlertCircle } from "lucide-react"
import styles from "./ImageUploadDropzone.module.css"
import { createUploadUrlAction } from "../../actions/upload"

type UploadState = "idle" | "converting" | "uploading" | "done" | "error"

interface ImageUploadDropzoneProps {
  name: string
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  kind?: "products" | "blog" | "avatars"
}

export function ImageUploadDropzone({
  name,
  value,
  onChange,
  label = "انتخاب یا کشیدن عکس",
  hint = "فقط JPG, PNG, WebP (حداکثر ۵ مگابایت)",
  kind = "products",
}: ImageUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>(value ? "done" : "idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("حجم فایل بیش از ۵ مگابایت است")
      setUploadState("error")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("فرمت پشتیبانی نمیشود — فقط JPEG، PNG یا WebP")
      setUploadState("error")
      return
    }

    setUploadState("converting")
    try {
      // 1. Convert to WebP
      const blob = await convertToWebP(file)
      
      // 2. Get Presigned URL
      const actionRes = await createUploadUrlAction({
        kind,
        contentType: "image/webp",
        sizeBytes: blob.size,
      })

      if (!actionRes.success) {
        throw new Error(actionRes.error || "خطا در دریافت لینک آپلود")
      }

      const { uploadUrl, publicUrl } = actionRes.data!

      // 3. Upload with XHR
      setUploadState("uploading")
      setProgress(0)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error("آپلود ناموفق بود — دوباره تلاش کنید"))
          }
        }
        xhr.onerror = () => reject(new Error("آپلود ناموفق بود — دوباره تلاش کنید"))
        
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", "image/webp")
        xhr.send(blob)
      })

      // 4. Done
      setUploadState("done")
      onChange(publicUrl)
    } catch (err: any) {
      setErrorMsg(err.message || "آپلود ناموفق بود — دوباره تلاش کنید")
      setUploadState("error")
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    processFile(files[0])
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

  const reset = () => {
    onChange(null)
    setUploadState("idle")
    setProgress(0)
    setErrorMsg("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Update internal state if value is cleared externally
  if (!value && uploadState === "done") {
    setUploadState("idle")
  } else if (value && uploadState === "idle") {
    setUploadState("done")
  }

  return (
    <div className={styles.dzContainer}>
      <input type="hidden" name={name} value={value ?? ""} />

      {uploadState === "done" && value ? (
        <div className={styles.dzPreviewCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className={styles.dzPreviewImg} />
          <button
            type="button"
            className={styles.dzRemoveBtn}
            onClick={reset}
            title="حذف تصویر"
          >
            <X style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          </button>
        </div>
      ) : uploadState === "converting" || uploadState === "uploading" ? (
        <div className={`${styles.dzDropArea} ${styles.dzUploading}`}>
          <Loader2 className={`animate-spin text-primary-500 mb-2`} size={32} />
          <p className="text-sm font-medium">
            {uploadState === "converting" ? "در حال تبدیل..." : `در حال آپلود... ${progress}%`}
          </p>
          {uploadState === "uploading" && (
            <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-200" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>
      ) : uploadState === "error" ? (
        <div className={`${styles.dzDropArea} ${styles.dzError}`}>
          <AlertCircle className="text-red-500 mb-2" size={32} />
          <p className="text-sm text-red-600 text-center px-4 mb-3">{errorMsg}</p>
          <button
            type="button"
            onClick={reset}
            className="text-sm px-4 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            دوباره تلاش کنید
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
            accept="image/jpeg,image/png,image/webp"
            className={styles.dzHiddenInput}
            onChange={(e) => handleFiles(e.target.files)}
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

function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      let width = img.width
      let height = img.height
      const MAX_WIDTH = 1600

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Blob conversion failed"))
        },
        "image/webp",
        0.85
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Invalid image"))
    }
    
    img.src = url
  })
}
