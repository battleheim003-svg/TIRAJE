import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import styles from "./Button.module.css"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const cls = [
      styles["ui-btn"],
      styles[`ui-btn--${variant}`],
      size !== "md" ? styles[`ui-btn--${size}`] : undefined,
      loading ? styles["ui-btn--loading"] : undefined,
      className,
    ]
      .filter(Boolean)
      .join(" ")

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = "Button"
