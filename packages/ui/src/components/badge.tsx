import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
        success:
          "bg-[var(--color-success-muted)] text-[var(--color-success)]",
        warning:
          "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
        danger:
          "bg-[var(--color-danger-muted)] text-[var(--color-danger)]",
        info:
          "bg-[var(--color-info-muted)] text-[var(--color-info)]",
        neutral:
          "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
        outline:
          "border border-[var(--color-border-strong)] text-[var(--color-text-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
