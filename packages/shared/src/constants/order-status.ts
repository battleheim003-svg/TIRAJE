export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:           ["AWAITING_PAYMENT", "CONFIRMED", "CANCELLED"],
  AWAITING_PAYMENT:  ["CONFIRMED", "CANCELLED"],
  CONFIRMED:         ["PROCESSING", "CANCELLED"],
  PROCESSING:        ["SHIPPED", "CANCELLED"],
  SHIPPED:           ["DELIVERED"],
  DELIVERED:         ["REFUNDED"],
  CANCELLED:         [],
  REFUNDED:          [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).includes(to)
}
