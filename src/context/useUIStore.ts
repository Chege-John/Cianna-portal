import { create } from "zustand";

interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Global Zustand store for client UI layout states (sidebar toggle, active tabs)
export const useUIStore = create<UIState>((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
export type UIStore = typeof useUIStore;
