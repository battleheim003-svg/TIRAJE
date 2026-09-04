import { Badge, type BadgeProps } from "./badge"

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PENDING:    { label: "در انتظار تأیید", variant: "warning" },
  CONFIRMED:  { label: "تأیید شده",       variant: "info" },
  PROCESSING: { label: "در حال پردازش",   variant: "info" },
  SHIPPED:    { label: "ارسال شده",        variant: "default" },
  DELIVERED:  { label: "تحویل داده شده",  variant: "success" },
  CANCELLED:  { label: "لغو شده",          variant: "danger" },
  REFUNDED:   { label: "بازگشت وجه",       variant: "neutral" },
}

type QuoteStatus = "PENDING" | "REVIEWING" | "QUOTED" | "ACCEPTED" | "REJECTED" | "EXPIRED"
const QUOTE_CONFIG: Record<QuoteStatus, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING:   { label: "در انتظار بررسی", variant: "warning" },
  REVIEWING: { label: "در حال بررسی",   variant: "info" },
  QUOTED:    { label: "قیمت‌گذاری شده", variant: "default" },
  ACCEPTED:  { label: "پذیرفته شده",    variant: "success" },
  REJECTED:  { label: "رد شده",          variant: "danger" },
  EXPIRED:   { label: "منقضی شده",       variant: "neutral" },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as OrderStatus] ?? { label: status, variant: "neutral" as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const cfg = QUOTE_CONFIG[status as QuoteStatus] ?? { label: status, variant: "neutral" as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
