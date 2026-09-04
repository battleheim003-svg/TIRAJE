import * as React from "react"
import { cn } from "../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors resize-y",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options, placeholder, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <select
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-danger)]",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"
