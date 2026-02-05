import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  hasCompletedOnboarding: boolean;
  selectedProviders: string[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setSelectedProviders: (providers: string[]) => void;
  toggleProvider: (providerId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      hasCompletedOnboarding: false,
      selectedProviders: [],

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light';
          root.classList.toggle('dark', systemTheme === 'dark');
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }
      },

      setHasCompletedOnboarding: (value) => {
        set({ hasCompletedOnboarding: value });
      },

      setSelectedProviders: (providers) => {
        set({ selectedProviders: providers });
      },

      toggleProvider: (providerId) => {
        set((state) => ({
          selectedProviders: state.selectedProviders.includes(providerId)
            ? state.selectedProviders.filter((id) => id !== providerId)
            : [...state.selectedProviders, providerId],
        }));
      },
    }),
    {
      name: 'email-budget-settings',
    }
  )
);

// Initialize theme on app load
export function initializeTheme() {
  const settings = useSettingsStore.getState();
  const root = document.documentElement;

  if (settings.theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  } else {
    root.classList.toggle('dark', settings.theme === 'dark');
  }
}
