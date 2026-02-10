import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  profileDialogOpen: boolean;
  setProfileDialogOpen: (open: boolean) => void;
  editingProfileId: string | null;
  setEditingProfileId: (id: string | null) => void;

  generationDialogOpen: boolean;
  setGenerationDialogOpen: (open: boolean) => void;

  textModalOpen: boolean;
  setTextModalOpen: (open: boolean) => void;

  // Selected profile for generation
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;

  // Theme (cyberpunk only, no toggle needed)
  theme: 'dark';

  // Language preference
  lastLanguage: string;
  setLastLanguage: (language: string) => void;

  // Model size preference
  lastModelSize: string;
  setLastModelSize: (modelSize: string) => void;

  // History search
  historySearch: string;
  setHistorySearch: (search: string) => void;

  // Favorites filter
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      profileDialogOpen: false,
      setProfileDialogOpen: (open) => set({ profileDialogOpen: open }),
      editingProfileId: null,
      setEditingProfileId: (id) => set({ editingProfileId: id }),

      generationDialogOpen: false,
      setGenerationDialogOpen: (open) => set({ generationDialogOpen: open }),

      textModalOpen: false,
      setTextModalOpen: (open) => set({ textModalOpen: open }),

      selectedProfileId: null,
      setSelectedProfileId: (id) => set({ selectedProfileId: id }),

      theme: 'dark',

      lastLanguage: 'en',
      setLastLanguage: (language) => set({ lastLanguage: language }),

      lastModelSize: '1.7B',
      setLastModelSize: (modelSize) => set({ lastModelSize: modelSize }),

      historySearch: '',
      setHistorySearch: (search) => set({ historySearch: search }),

      showFavoritesOnly: false,
      setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
    }),
    {
      name: 'voicebox-ui',
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        lastLanguage: state.lastLanguage,
        lastModelSize: state.lastModelSize,
        selectedProfileId: state.selectedProfileId,
        showFavoritesOnly: state.showFavoritesOnly,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    },
  ),
);
