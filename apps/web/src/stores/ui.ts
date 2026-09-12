import { create } from "zustand"

type Theme = "light" | "dark" | "system"

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  mobileMenuOpen: boolean

  cartDrawerOpen: boolean

  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  toggleCartDrawer: () => void
  setCartDrawerOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  theme: "system",
  sidebarOpen: false,
  mobileMenuOpen: false,
  cartDrawerOpen: false,

  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== "undefined") {
      const root = document.documentElement
      if (theme === "system") {
        root.removeAttribute("data-theme")
      } else {
        root.setAttribute("data-theme", theme)
      }
    }
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  toggleCartDrawer: () =>
    set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),

  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
}))

