export const PERMISSIONS = {
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  ORDERS_READ: "orders:read",
  ORDERS_UPDATE: "orders:update",
  USERS_READ: "users:read",
  USERS_UPDATE: "users:update",
  BLOG_ALL: "blog:*",
  PRICES_PUBLISH: "prices:publish",
  TICKETS_REPLY: "tickets:reply",
  QUOTES_UPDATE: "quotes:update",
  CATEGORIES_ALL: "categories:*",
  BRANDS_ALL: "brands:*",
  SHIPPING_MANAGE: "shipping:manage",
  FACTORIES_MANAGE: "factories:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OPERATOR: "operator",
  SUPPORT: "support",
  CUSTOMER: "customer",
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]
