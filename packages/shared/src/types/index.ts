// ─── Action Results ──────────────────────────────────────────────────────────

export type ActionSuccess<T = void> = [T] extends [void]
  ? { success: true; data?: undefined }
  : { success: true; data: T }

export type ActionError = {
  success: false
  error: string
  fieldErrors?: Record<string, string | string[]>
  retryAfterSec?: number
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionError

// ─── Pagination ──────────────────────────────────────────────────────────────

export type PaginationMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PaginatedResult<T> = {
  data: T[]
  meta: PaginationMeta
}

// ─── Customer types (mirrors Prisma enum) ───────────────────────────────────

export type CustomerType = "NORMAL" | "CONTRACTOR" | "COMPANY"

// ─── Session user (what Auth.js puts in session.user) ────────────────────────

export type SessionUser = {
  id: string
  email: string
  name: string | null
  image: string | null
  customerType: CustomerType
  roleId: string | null
  roleName: string | null
  permissions: string[]
}

// ─── Cart (client-side Zustand store shape) ──────────────────────────────────

export type CartItem = {
  productId: string
  slug: string
  name: string
  imageUrl: string | null
  pricePerTon: number
  quantityTon: number
  weightPerUnit: number
  unit: string
}

export type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantityTon"> & { quantityTon?: number }) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantityTon: number) => void
  clear: () => void
  totalTons: () => number
  subtotal: () => number
}

// ─── Freight calculation ─────────────────────────────────────────────────────

export type FreightQuote = {
  zoneId: string
  zoneName: string
  truckType: string
  baseCost: number
  costPerTon: number
  totalWeight: number
  freightCost: number
  estimatedDaysMin: number
  estimatedDaysMax: number
}
