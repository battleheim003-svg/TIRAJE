export const OUTBOX_EVENTS = {
  ORDER_CREATED:        "order.created",
  ORDER_PAID:           "order.paid",
  ORDER_STATUS_CHANGED: "order.status_changed",
  QUOTE_CREATED:        "quote.created",
  QUOTE_ANSWERED:       "quote.answered",
  CONTACT_CREATED:      "contact.created",
  PRICE_PUBLISHED:      "price.published",
  PRODUCT_UPDATED:      "product.updated",
} as const

export const OUTBOX_CHANNELS = {
  TG_CHANNEL: "tg_channel",
  TG_ADMIN:   "tg_admin",
  TG_USER:    "tg_user",
  EMAIL:      "email",
  SMS:        "sms", // فعلاً no-op
} as const

export type OutboxEvent = (typeof OUTBOX_EVENTS)[keyof typeof OUTBOX_EVENTS]
export type OutboxChannel = (typeof OUTBOX_CHANNELS)[keyof typeof OUTBOX_CHANNELS]
