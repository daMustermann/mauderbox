import { create } from 'zustand';
import type { ActiveDownloadTask } from '@/lib/api/types';

interface ActiveTasksState {
  activeDownloads: ActiveDownloadTask[];
  setActiveDownloads: (downloads: ActiveDownloadTask[]) => void;
}

export const useActiveTasksStore = create<ActiveTasksState>((set) => ({
  activeDownloads: [],
  setActiveDownloads: (downloads) => set({ activeDownloads: downloads }),
}));
