"use client"

import React, { useMemo } from "react"
import { Image as ImageIcon, Send, ExternalLink } from "lucide-react"
import styles from "./TelegramPostPreview.module.css"

export interface TelegramPostPreviewProps {
  image: string | null
  title: string
  excerpt: string
  hashtags: string[]
  linkLabel: string
  linkUrl: string
  channelUsername: string
}

const MAX_CAPTION_LENGTH = 1024
const MAX_EXCERPT_LENGTH = 900

export function TelegramPostPreview({
  image,
  title,
  excerpt,
  hashtags,
  linkLabel,
  channelUsername,
}: TelegramPostPreviewProps) {
  // Truncate excerpt if longer than 900
  const effectiveExcerpt = useMemo(() => {
    if (!excerpt) return ""
    if (excerpt.length <= MAX_EXCERPT_LENGTH) return excerpt
    return excerpt.slice(0, MAX_EXCERPT_LENGTH - 1).trimEnd() + "…"
  }, [excerpt])

  const hashtagsString = useMemo(() => {
    return hashtags.filter(Boolean).join(" ")
  }, [hashtags])

  // Compute total simulated Telegram caption length
  const totalCaptionLength = useMemo(() => {
    const parts: string[] = []
    if (title) parts.push(title)
    if (effectiveExcerpt) parts.push(effectiveExcerpt)
    if (hashtagsString) parts.push(hashtagsString)
    if (channelUsername) parts.push(channelUsername)
    // Joined with double newlines
    return parts.join("\n\n").length
  }, [title, effectiveExcerpt, hashtagsString, channelUsername])

  const remainingChars = MAX_CAPTION_LENGTH - totalCaptionLength
  const isOverLimit = remainingChars < 0

  return (
    <div className={styles.tgpWrapper}>
      <div className={styles.tgpHeader}>
        <span className={styles.tgpHeaderTitle}>
          <Send style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          پیش‌نمایش زنده پست تلگرام
        </span>
        <span
          className={`${styles.tgpCounterLimit} ${
            isOverLimit ? styles.tgpCounterOverLimit : ""
          }`}
        >
          {remainingChars >= 0
            ? `${remainingChars} کاراکتر باقی‌مانده`
            : `${Math.abs(remainingChars)} کاراکتر بیش از حد مجاز!`}
        </span>
      </div>

      <div className={styles.tgpChatContainer}>
        <div className={styles.tgpBubble}>
          {/* Image */}
          <div className={styles.tgpImageWrap}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={title || "Telegram post preview"}
                className={styles.tgpImage}
              />
            ) : (
              <div className={styles.tgpImagePlaceholder}>
                <ImageIcon style={{ width: "2rem", height: "2rem" }} aria-hidden="true" />
                <span>تصویر شاخص انتخاب نشده</span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className={styles.tgpCaption}>
            <div className={styles.tgpTitle}>
              {title ? `**${title}**` : "**عنوان پست تلگرام**"}
            </div>

            {effectiveExcerpt ? (
              <div className={styles.tgpExcerpt}>{effectiveExcerpt}</div>
            ) : (
              <div className={styles.tgpExcerpt} style={{ color: "#708499" }}>
                متن خلاصه یا توضیحات کوتاه در این قسمت قرار می‌گیرد...
              </div>
            )}

            {hashtagsString && (
              <div className={styles.tgpHashtags}>{hashtagsString}</div>
            )}

            <div className={styles.tgpChannel}>
              {channelUsername || "@TirajehConcrete"}
            </div>
          </div>

          {/* Inline Keyboard Button */}
          <div className={styles.tgpKeyboardArea}>
            <div className={styles.tgpButton}>
              <ExternalLink style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              <span>{linkLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
