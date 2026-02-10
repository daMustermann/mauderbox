import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { HistoryQuery } from '@/lib/api/types';
import { isTauri } from '@/lib/tauri';

export function useHistory(query?: HistoryQuery) {
  return useQuery({
    queryKey: queryKeys.history.list(query),
    queryFn: () => apiClient.listHistory(query),
  });
}

export function useGenerationDetail(generationId: string) {
  return useQuery({
    queryKey: queryKeys.history.detail(generationId),
    queryFn: () => apiClient.getGeneration(generationId),
    enabled: !!generationId,
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId: string) => apiClient.deleteGeneration(generationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId: string) => apiClient.toggleFavorite(generationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });
}

export function useExportGeneration() {
  return useMutation({
    mutationFn: async ({ generationId, text }: { generationId: string; text: string }) => {
      const blob = await apiClient.exportGeneration(generationId);
      
      // Create safe filename from text
      const safeText = text.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `generation-${safeText}.voicebox.zip`;
      
      if (isTauri()) {
        // Use Tauri's native save dialog
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const filePath = await save({
            defaultPath: filename,
            filters: [
              {
                name: 'Voicebox Generation',
                extensions: ['voicebox.zip', 'zip'],
              },
            ],
          });
          
          if (filePath) {
            // Write file using Tauri's filesystem API
            const { writeFile } = await import('@tauri-apps/plugin-fs');
            const arrayBuffer = await blob.arrayBuffer();
            await writeFile(filePath, new Uint8Array(arrayBuffer));
          }
        } catch (error) {
          console.error('Failed to use Tauri dialog, falling back to browser download:', error);
          // Fall back to browser download if Tauri dialog fails
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        // Browser: trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      return blob;
    },
  });
}

export function useExportGenerationAudio() {
  return useMutation({
    mutationFn: async ({ generationId, text }: { generationId: string; text: string }) => {
      // Determine format based on user intent (here we assume mp3 is preferred if available)
      const format = 'mp3';
      const blob = await apiClient.exportGenerationAudio(generationId, format);
      
      // Create safe filename from text
      const safeText = text.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${safeText}.${format}`;
      
      if (isTauri()) {
        // Use Tauri's native save dialog
        let filePath: string | null = null;
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          
          filePath = await save({
            defaultPath: filename,
            filters: [
              {
                name: 'MP3 Audio',
                extensions: ['mp3'],
              },
              {
                 name: 'WAV Audio',
                 extensions: ['wav'],
              }
            ],
          });
        } catch (dialogError) {
          console.error("Dialog failed:", dialogError);
          throw new Error("Failed to open save dialog");
        }

        if (filePath) {
           try {
              const { writeFile } = await import('@tauri-apps/plugin-fs');
              const arrayBuffer = await blob.arrayBuffer();
              await writeFile(filePath, new Uint8Array(arrayBuffer));
              return blob; // Success
           } catch (writeError: any) {
              console.error("Write failed:", writeError);
              throw new Error(`Failed to save file to ${filePath}: ${writeError.message || writeError}`);
           }
        } else {
           // User cancelled
           return null;
        }

      } else {
        // Browser: trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      return blob;
    },
  });
}

export function useImportGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => apiClient.importGeneration(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });
}
