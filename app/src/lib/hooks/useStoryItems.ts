import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { StoryItemCreate, StoryItemBatchUpdate, StoryItemReorder, StoryItemMove, StoryItemTrim, StoryItemSplit } from '@/lib/api/types';

/**
 * Story Item (Clip) Hooks
 *
 * These hooks manage individual clips within a story timeline:
 * - Adding/removing clips
 * - Reordering clips
 * - Trimming and splitting clips
 * - Duplicating clips
 *
 * Separated from useStories.ts for better organization.
 */

export function useAddStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryItemCreate }) =>
      apiClient.addStoryItem(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useRemoveStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, itemId }: { storyId: string; itemId: string }) =>
      apiClient.removeStoryItem(storyId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useUpdateStoryItemTimes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryItemBatchUpdate }) =>
      apiClient.updateStoryItemTimes(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useReorderStoryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: StoryItemReorder }) =>
      apiClient.reorderStoryItems(storyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useMoveStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, itemId, data }: { storyId: string; itemId: string; data: StoryItemMove }) =>
      apiClient.moveStoryItem(storyId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useTrimStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, itemId, data }: { storyId: string; itemId: string; data: StoryItemTrim }) =>
      apiClient.trimStoryItem(storyId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useSplitStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, itemId, data }: { storyId: string; itemId: string; data: StoryItemSplit }) =>
      apiClient.splitStoryItem(storyId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}

export function useDuplicateStoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, itemId }: { storyId: string; itemId: string }) =>
      apiClient.duplicateStoryItem(storyId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(variables.storyId) });
    },
  });
}
