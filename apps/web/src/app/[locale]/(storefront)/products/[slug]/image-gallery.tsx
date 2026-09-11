"use client"

import { useState } from "react"
import Image from "next/image"
import { Package, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import styles from "./ProductGallery.module.css"

interface GalleryImage {
  id: string
  url: string
  altFa?: string | null
  altEn?: string | null
  isPrimary: boolean
}

interface ImageGalleryProps {
  images: GalleryImage[]
  productName: string
  locale: string
}

export function ImageGallery({ images, productName, locale }: ImageGalleryProps) {
  const fa = locale === "fa"
  const primary = images.find((i) => i.isPrimary) ?? images[0] ?? null
  const [active, setActive] = useState<GalleryImage | null>(primary)
  const [imageError, setImageError] = useState(false)

  const altText = (img: GalleryImage) =>
    fa ? (img.altFa ?? productName) : (img.altEn ?? productName)

  return (
    <div className={styles["web-pdtl-gal"]}>
      {/* Main image container */}
      <div className={styles["web-pdtl-gal__main"]}>
        {active && !imageError ? (
          <Image
            src={active.url}
            alt={altText(active)}
            fill
            priority
            unoptimized={true}
            draggable={false}
            onError={() => setImageError(true)}
            sizes="(max-width:768px) 100vw, 50vw"
            className={styles["web-pdtl-gal__main-img"]}
          />
        ) : (
          <div className={styles["web-pdtl-gal__placeholder"]}>
            <Package style={{ width: "4.5rem", height: "4.5rem" }} />
            <span className={styles["web-pdtl-gal__placeholder-text"]}>
              {fa ? "تصویر رسمی سیمان تیراژه" : "Tirajeh Official Image"}
            </span>
          </div>
        )}

        {/* Badges on image */}
        <div className={styles["web-pdtl-gal__badges"]}>
          <Badge variant="solid">
            <ShieldCheck style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
            {fa ? "اصالت ۱۰۰٪ کارخانه" : "100% Factory Certified"}
          </Badge>
          <Badge variant="success">
            <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
            {fa ? "تولید روز" : "Fresh Production"}
          </Badge>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className={styles["web-pdtl-gal__thumbs"]}
          role="list"
          aria-label={fa ? "تصاویر محصول" : "Product images"}
        >
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              aria-label={altText(img)}
              aria-pressed={active?.id === img.id}
              onClick={() => {
                setImageError(false)
                setActive(img)
              }}
              className={`${styles["web-pdtl-gal__thumb"]} ${
                active?.id === img.id ? styles["web-pdtl-gal__thumb--active"] : ""
              }`}
            >
              <Image
                src={img.url}
                alt={altText(img)}
                fill
                unoptimized={true}
                draggable={false}
                sizes="5rem"
                className={styles["web-pdtl-gal__thumb-img"]}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}