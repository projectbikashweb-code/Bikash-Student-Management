import { create } from 'zustand'

interface UIStore {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}))
