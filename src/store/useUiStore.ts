import { create } from "zustand";

// 1. Define the state shape and actions
interface UiState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    // Add other simple UI states here later if needed
    // e.g., themePreference: 'light' | 'dark' | 'system';
    // e.g., setThemePreference: (pref: UiState['themePreference']) => void;
}

// 2. Create the store hook
export const useUiStore = create<UiState>((set) => ({
    // Initial state
    isSidebarOpen: false,

    // Action to toggle the sidebar
    toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

    // Example for other actions:
    // themePreference: 'system',
    // setThemePreference: (pref) => set({ themePreference: pref }),
}));

// Optional: Add persist middleware later if needed
/*
import { persist, createJSONStorage } from 'zustand/middleware'

export const useUiStore = create(
    persist<UiState>(
        (set) => ({
            isSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        }),
        {
            name: 'ui-storage', // unique name
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
)
*/
