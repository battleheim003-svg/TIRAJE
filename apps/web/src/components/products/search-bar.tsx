"use client"

import { useCallback, useRef, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, X } from "lucide-react"

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
    <>
      <div className={`sb-wrap${className ? ` ${className}` : ""}`}>
        <Search className="sb-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          autoFocus={autoFocus}
          defaultValue={currentQuery}
          onKeyDown={handleKeyDown}
          placeholder={t("searchPlaceholder")}
          className={`sb-input${isPending ? " sb-input--pending" : ""}`}
          aria-label={t("searchPlaceholder")}
        />
        {currentQuery && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="پاک کردن جستجو"
            className="sb-clear"
          >
            <X className="sb-clear-icon" aria-hidden="true" />
          </button>
        )}
      </div>

      <style>{`
        .sb-wrap {
          position: relative; display: flex; align-items: center;
        }
        .sb-icon {
          position: absolute; inset-inline-start: 0.75rem; pointer-events: none;
          width: 1rem; height: 1rem; color: var(--color-text-muted);
        }
        .sb-input {
          width: 100%;
          padding: 0.625rem 2.25rem 0.625rem 2.25rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: var(--radius-lg);
          font-size: 0.875rem; font-family: inherit; color: var(--color-text);
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast);
        }
        .sb-input::placeholder { color: var(--color-text-muted); }
        .sb-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
        }
        .sb-input--pending { opacity: 0.7; }
        .sb-clear {
          position: absolute; inset-inline-end: 0.625rem;
          display: flex; align-items: center; justify-content: center;
          padding: 0.125rem; border-radius: var(--radius-sm);
          background: none; border: none; cursor: pointer;
          color: var(--color-text-muted); transition: color var(--transition-fast);
        }
        .sb-clear:hover { color: var(--color-text); }
        .sb-clear-icon { width: 0.875rem; height: 0.875rem; }
      `}</style>
    </>
  )
}
