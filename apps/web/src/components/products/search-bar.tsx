"use client"

import { useCallback, useRef, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, X } from "lucide-react"
import styles from "./SearchBar.module.css"

interface SearchBarProps {
  className?: string
  autoFocus?: boolean
}

export function SearchBar({ className, autoFocus }: SearchBarProps) {
  const t = useTranslations("products")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const currentQuery = searchParams.get("q") ?? ""

  const pushSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set("q", value.trim())
        params.set("page", "1")
      } else {
        params.delete("q")
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") pushSearch(e.currentTarget.value)
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ""
      inputRef.current.focus()
    }
    pushSearch("")
  }

  return (
    <div className={`${styles["web-search-bar__wrap"]}${className ? ` ${className}` : ""}`}>
      <Search
        className={styles["web-search-bar__icon"]}
        style={{ width: "1rem", height: "1rem" }}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        autoFocus={autoFocus}
        defaultValue={currentQuery}
        onKeyDown={handleKeyDown}
        placeholder={t("searchPlaceholder")}
        className={`${styles["web-search-bar__input"]}${
          isPending ? ` ${styles["web-search-bar__inputPending"]}` : ""
        }`}
        aria-label={t("searchPlaceholder")}
      />
      {currentQuery && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="پاک کردن جستجو"
          className={styles["web-search-bar__clear"]}
        >
          <X style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
