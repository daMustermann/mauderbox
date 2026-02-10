import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServerStore {
  serverUrl: string;
  setServerUrl: (url: string) => void;

  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  mode: 'local' | 'remote';
  setMode: (mode: 'local' | 'remote') => void;

  keepServerRunningOnClose: boolean;
  setKeepServerRunningOnClose: (keepRunning: boolean) => void;

  serviceMode: boolean;
  setServiceMode: (enabled: boolean) => void;
}

export const useServerStore = create<ServerStore>()(
  persist(
    (set) => ({
      serverUrl: (() => {
        const envUrl = import.meta.env.VITE_API_URL;
        if (envUrl) {
          return envUrl;
        }

        const isTauri = Boolean(
          (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
            (window as unknown as { __TAURI__?: unknown }).__TAURI__,
        );

        return isTauri ? 'http://127.0.0.1:17493' : 'http://127.0.0.1:17493';
      })(),
      setServerUrl: (url) => set({ serverUrl: url }),

      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),

      mode: 'local',
      setMode: (mode) => set({ mode }),

      keepServerRunningOnClose: false,
      setKeepServerRunningOnClose: (keepRunning) => set({ keepServerRunningOnClose: keepRunning }),

      serviceMode: false,
      setServiceMode: (enabled) => set({ serviceMode: enabled }),
    }),
    {
      name: 'voicebox-server',
      version: 2,
      migrate: (persistedState, _version) => {
        const state = persistedState as Partial<ServerStore>;
        const serverUrl = state.serverUrl;
        const migratedUrl =
          typeof serverUrl === 'string' && serverUrl.includes(':8000')
            ? serverUrl.replace(':8000', ':17493')
            : serverUrl;

        const serviceMode = state.serviceMode ?? false;
        const keepServerRunningOnClose =
          state.keepServerRunningOnClose ?? !!serviceMode;

        return {
          ...state,
          serverUrl: migratedUrl,
          keepServerRunningOnClose,
          serviceMode,
        } as ServerStore;
      },
    },
  ),
);
