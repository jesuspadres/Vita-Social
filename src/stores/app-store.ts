import { create } from "zustand";
import type { Tab } from "@/lib/constants";

// ---------------------------------------------------------------------------
// App Store
// Global UI state that doesn't belong to any specific feature.
// ---------------------------------------------------------------------------

interface AppState {
  /** The currently selected bottom-navigation tab. */
  activeTab: Tab;

  /** Switch the active navigation tab. */
  setActiveTab: (tab: Tab) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "discover",

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
