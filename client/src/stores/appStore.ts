import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  darkMode: boolean
  sidebarCollapsed: boolean
  toggleDarkMode: () => void
  setDarkMode: (v: boolean) => void
  toggleSidebar: () => void
}

function applyDarkMode(enabled: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', enabled)
  }
}

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: prefersDark,
      sidebarCollapsed: false,
      toggleDarkMode: () => {
        const next = !get().darkMode
        applyDarkMode(next)
        set({ darkMode: next })
      },
      setDarkMode: (v) => {
        applyDarkMode(v)
        set({ darkMode: v })
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'mistake-hunter-app',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDarkMode(state.darkMode)
        }
      },
    }
  )
)
