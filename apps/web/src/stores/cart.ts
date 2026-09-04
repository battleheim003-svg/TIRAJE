import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/** Client-side cart item — extends DB shape with display fields */
export interface CartItem {
  /** DB CartItem.id — used for remove/update actions */
  id: string
  productId: string
  productName: string
  slug: string
  imageUrl: string | null
  /** Price in Rial per ton */
  pricePerTonRial: number
  quantityTon: number
  minOrderTon: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  _hydrated: boolean

  // Sync actions (optimistic updates)
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantityTon: number) => void
  clearCart: () => void

  // Drawer
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Hydration
  setHydrated: () => void

  // Computed
  totalItems: () => number
  totalWeightTon: () => number
  totalRial: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hydrated: false,

      setItems: (items) => set({ items }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantityTon: i.quantityTon + item.quantityTon }
                  : i,
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      updateQuantity: (itemId, quantityTon) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantityTon } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setHydrated: () => set({ _hydrated: true }),

      totalItems: () => get().items.length,
      totalWeightTon: () =>
        get().items.reduce((sum, item) => sum + item.quantityTon, 0),
      totalRial: () =>
        get().items.reduce(
          (sum, item) => sum + item.pricePerTonRial * item.quantityTon,
          0,
        ),
    }),
    {
      name: "tirajeh-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)
