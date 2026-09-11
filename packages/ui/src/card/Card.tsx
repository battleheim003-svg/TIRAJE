import * as React from "react"
import styles from "./Card.module.css"

/* ── Card ──────────────────────────────────────── */

export type CardVariant = "flat" | "raised" | "outlined"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  interactive?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "flat", interactive = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        styles["ui-card"],
        styles[`ui-card--${variant}`],
        interactive ? styles["ui-card--interactive"] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = "Card"

/* ── CardHeader ────────────────────────────────── */

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  borderless?: boolean
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, description, action, borderless, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        styles["ui-card__header"],
        borderless ? styles["ui-card__header--borderless"] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div>
        {title && <h3 className={styles["ui-card__title"]}>{title}</h3>}
        {description && (
          <p className={styles["ui-card__description"]}>{description}</p>
        )}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
)
CardHeader.displayName = "CardHeader"

/* ── CardBody ──────────────────────────────────── */

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  flush?: boolean
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ flush, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        styles["ui-card__body"],
        flush ? styles["ui-card__body--flush"] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  )
)
CardBody.displayName = "CardBody"

/* ── CardFooter ────────────────────────────────── */

export type CardFooterAlign = "start" | "end" | "between"

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: CardFooterAlign
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ align = "start", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        styles["ui-card__footer"],
        align === "end" ? styles["ui-card__footer--end"] : undefined,
        align === "between" ? styles["ui-card__footer--between"] : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  )
)
CardFooter.displayName = "CardFooter"

/* ── Compatibility Aliases ─────────────────────── */
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={[styles["ui-card__title"], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={[styles["ui-card__description"], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </p>
  )
)
CardDescription.displayName = "CardDescription"

export const CardContent = CardBody
