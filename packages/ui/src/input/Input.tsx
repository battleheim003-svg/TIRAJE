import * as React from "react"
import styles from "./Input.module.css"

/* ── Label ─────────────────────────────────────── */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={[
        styles["ui-inp__label"],
        required ? styles["ui-inp__label--required"] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </label>
  )
)
Label.displayName = "Label"

/* ── Input ─────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
  helperText?: string
  errorText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, helperText, errorText, className, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        aria-invalid={error || !!errorText ? "true" : undefined}
        className={[styles["ui-inp__field"], className].filter(Boolean).join(" ")}
        {...props}
      />
    )

    return (
      <div>
        {icon ? (
          <div className={styles["ui-inp__wrapper"]}>
            <span className={styles["ui-inp__icon"]}>{icon}</span>
            {field}
          </div>
        ) : (
          field
        )}
        {errorText && (
          <p className={styles["ui-inp__error"]} role="alert">
            {errorText}
          </p>
        )}
        {helperText && !errorText && (
          <p className={styles["ui-inp__helper"]}>{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

/* ── Textarea ──────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorText?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, errorText, helperText, className, ...props }, ref) => (
    <div>
      <textarea
        ref={ref}
        aria-invalid={error || !!errorText ? "true" : undefined}
        className={[
          styles["ui-inp__field"],
          styles["ui-inp__textarea"],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {errorText && (
        <p className={styles["ui-inp__error"]} role="alert">
          {errorText}
        </p>
      )}
      {helperText && !errorText && (
        <p className={styles["ui-inp__helper"]}>{helperText}</p>
      )}
    </div>
  )
)
Textarea.displayName = "Textarea"
