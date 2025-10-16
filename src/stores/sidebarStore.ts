import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  openDropdown: string | null;
  openNestedDropdown: string | null;
  hoveredMenu: string | null;
  toggleSidebar: () => void;
  setOpenDropdown: (menu: string | null) => void;
  setOpenNestedDropdown: (menu: string | null) => void;
  setHoveredMenu: (menu: string | null) => void;
  resetHoveredMenu: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  openDropdown: null,
  openNestedDropdown: null,
  hoveredMenu: null,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpenDropdown: (menu) => set({ openDropdown: menu }),
  setOpenNestedDropdown: (menu) => set({ openNestedDropdown: menu }),
  setHoveredMenu: (menu) => set({ hoveredMenu: menu }),
  resetHoveredMenu: () => set({ hoveredMenu: null }),
}));