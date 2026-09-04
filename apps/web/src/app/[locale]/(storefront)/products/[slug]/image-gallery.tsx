"use client"

import { useState } from "react"
import Image from "next/image"
import { Package, ShieldCheck, CheckCircle2 } from "lucide-react"

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
    <div className="gallery">
      {/* Main image container */}
      <div className="gallery__main">
        {active && !imageError ? (
          <Image
            src={active.url}
            alt={altText(active)}
            fill
            priority
            unoptimized={true}
            onError={() => setImageError(true)}
            sizes="(max-width:768px) 100vw, 50vw"
            className="gallery__main-img"
          />
        ) : (
          <div className="gallery__placeholder">
            <Package style={{ width: "4.5rem", height: "4.5rem", strokeWidth: 1.5 }} />
            <span className="gallery__placeholder-text">
              {fa ? "تصویر رسمی سیمان تیراژه" : "Tirajeh Official Image"}
            </span>
          </div>
        )}

        {/* Badges on image */}
        <div className="gallery__badges">
          <span className="gallery__badge gallery__badge--quality">
            <ShieldCheck style={{ width: "0.875rem", height: "0.875rem" }} />
            {fa ? "اصالت ۱۰۰٪ کارخانه" : "100% Factory Certified"}
          </span>
          <span className="gallery__badge gallery__badge--fresh">
            <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem" }} />
            {fa ? "تولید روز" : "Fresh Production"}
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery__thumbs" role="list" aria-label={fa ? "تصاویر محصول" : "Product images"}>
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
              className={`gallery__thumb ${active?.id === img.id ? "gallery__thumb--active" : ""}`}
            >
              <Image
                src={img.url}
                alt={altText(img)}
                fill
                unoptimized={true}
                sizes="5rem"
                className="gallery__thumb-img"
              />
            </button>
          ))}
        </div>
      )}

      <style>{`
        .gallery {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        .gallery__main {
          position: relative;
          aspect-ratio: 1 / 1;
          max-height: 480px;
          background: linear-gradient(145deg, #ffffff, #f1f5f9);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl, 1rem);
          overflow: hidden;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gallery__main-img {
          object-fit: contain;
          padding: 1.75rem;
          transition: transform 0.3s ease;
        }
        .gallery__main:hover .gallery__main-img {
          transform: scale(1.03);
        }
        .gallery__placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #64748b;
          text-align: center;
          padding: 2rem;
        }
        .gallery__placeholder-text {
          font-size: 0.875rem;
          font-weight: 600;
        }
        .gallery__badges {
          position: absolute;
          top: 1rem;
          inset-inline-start: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 2;
        }
        .gallery__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.65rem;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .gallery__badge--quality {
          background-color: #0f172a;
          color: #f8fafc;
        }
        .gallery__badge--fresh {
          background-color: #059669;
          color: #ffffff;
        }
        .gallery__thumbs {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.25rem 0;
        }
        .gallery__thumb {
          position: relative;
          width: 4.5rem;
          height: 4.5rem;
          flex-shrink: 0;
          border-radius: var(--radius-lg, 0.5rem);
          border: 2px solid var(--color-border);
          background-color: #ffffff;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gallery__thumb:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
        }
        .gallery__thumb--active {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
        }
        .gallery__thumb-img {
          object-fit: contain;
          padding: 0.375rem;
        }
      `}</style>
    </div>
  )
}
