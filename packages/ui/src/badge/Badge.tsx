import * as React from "react"
import styles from "./Badge.module.css"

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "solid"
  | "danger"
  | "info"
  | "neutral"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", dot = false, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={[
        styles["ui-badge"],
        styles[`ui-badge--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot && <span className={styles["ui-badge__dot"]} aria-hidden="true" />}
      {children}
    </span>
  )
)
Badge.displayName = "Badge"
