"use client"

import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

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

  const altText = (img: GalleryImage) =>
    fa ? (img.altFa ?? productName) : (img.altEn ?? productName)

  return (
    <div className="gallery">
      {/* Main image */}
      <div className="gallery__main">
        {active ? (
          <Image
            src={active.url}
            alt={altText(active)}
            fill
            priority
            sizes="(max-width:768px) 100vw, 50vw"
            className="gallery__main-img"
          />
        ) : (
          <span className="gallery__placeholder" aria-hidden="true">
            <Package style={{ width: "4rem", height: "4rem" }} />
          </span>
        )}
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
              onClick={() => setActive(img)}
              className={`gallery__thumb ${active?.id === img.id ? "gallery__thumb--active" : ""}`}
            >
              <Image
                src={img.url}
                alt={altText(img)}
                fill
                sizes="4rem"
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
          gap: 0.75rem;
        }
        .gallery__main {
          position: relative;
          aspect-ratio: 1;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .gallery__main-img {
          object-fit: contain;
          padding: 1.5rem;
          transition: opacity var(--transition-fast);
        }
        .gallery__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }
        .gallery__thumbs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .gallery__thumb {
          position: relative;
          width: 4rem;
          height: 4rem;
          flex-shrink: 0;
          border-radius: var(--radius-md);
          border: 2px solid var(--color-border);
          background-color: var(--color-background);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .gallery__thumb:hover { border-color: var(--color-accent); }
        .gallery__thumb--active { border-color: var(--color-accent); }
        .gallery__thumb:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .gallery__thumb-img {
          object-fit: contain;
          padding: 0.25rem;
        }
      `}</style>
    </div>
  )
}
