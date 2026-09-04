import * as React from "react"
import { cn } from "../lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 border-b border-[var(--color-border)]", className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-semibold text-[var(--color-text)] leading-tight text-base", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[var(--color-text-muted)]", className)} {...props} />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center p-5 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] rounded-b-lg",
        className
      )}
      {...props}
    />
  )
}
