import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { StoryCreate } from '@/lib/api/types';
import { isTauri } from '@/lib/tauri';

/**
 * Story CRUD Hooks
 *
 * These hooks manage story-level operations:
 * - Listing all stories
 * - Getting story details
 * - Creating, updating, deleting stories
 * - Exporting story audio
 *
 * For clip-level operations, use useStoryItems.ts hooks instead.
 */

export function useStories() {
  return useQuery({
    queryKey: queryKeys.stories.list(),
    queryFn: () => apiClient.listStories(),
  });
}

export function useStory(storyId: string | null) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId!),
    queryFn: () => apiClient.getStory(storyId!),
    enabled: !!storyId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoryCreate) => apiClient.createStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryCreate }) =>
      apiClient.updateStory(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => apiClient.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
    },
  });
}

export function useExportStoryAudio() {
  return useMutation({
    mutationFn: async ({ storyId, storyName }: { storyId: string; storyName: string }) => {
      const blob = await apiClient.exportStoryAudio(storyId);

      // Create safe filename
      const safeName = storyName.substring(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${safeName || 'story'}.wav`;

      if (isTauri()) {
        // Use Tauri's native save dialog
        try {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const filePath = await save({
            defaultPath: filename,
            filters: [
              {
                name: 'Audio File',
                extensions: ['wav'],
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
