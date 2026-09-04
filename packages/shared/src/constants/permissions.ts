export const PERMISSIONS = {
  // Products
  PRODUCT_READ: "product:read",
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",
  // Orders
  ORDER_READ: "order:read",
  ORDER_UPDATE: "order:update",
  ORDER_CANCEL: "order:cancel",
  // Users
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  // Blog
  POST_READ: "post:read",
  POST_CREATE: "post:create",
  POST_UPDATE: "post:update",
  POST_DELETE: "post:delete",
  POST_PUBLISH: "post:publish",
  // Quotes
  QUOTE_READ: "quote:read",
  QUOTE_RESPOND: "quote:respond",
  // Shipments
  SHIPMENT_READ: "shipment:read",
  SHIPMENT_UPDATE: "shipment:update",
  // Settings
  SETTING_READ: "setting:read",
  SETTING_UPDATE: "setting:update",
  // Audit
  AUDIT_READ: "audit:read",
  // Dashboard
  DASHBOARD_READ: "dashboard:read",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SALES_AGENT: "sales_agent",
  CONTENT_EDITOR: "content_editor",
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]
