import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  offlineMode: boolean;
  syncFrequency: string;
  showNotifications: boolean;
  theme: string;
  toggleOfflineMode: () => void;
  setSyncFrequency: (frequency: string) => void;
  toggleNotifications: () => void;
  setTheme: (theme: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      offlineMode: false,
      syncFrequency: '30min',
      showNotifications: true,
      theme: 'light',
      
      toggleOfflineMode: () => set((state) => ({ 
        offlineMode: !state.offlineMode 
      })),
      
      setSyncFrequency: (frequency) => set({ syncFrequency: frequency }),
      
      toggleNotifications: () => set((state) => ({ 
        showNotifications: !state.showNotifications 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      resetSettings: () => set({
        offlineMode: false,
        syncFrequency: '30min',
        showNotifications: true,
        theme: 'light',
      }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);