/**
 * Centralized React Query Key Factory
 *
 * This file defines all query keys for the entire application.
 * Using a centralized factory pattern prevents:
 * - Typos in query keys (causes cache misses)
 * - Invalidation bugs (forgetting to invalidate the right key)
 * - Cache inconsistencies across the app
 *
 * Usage:
 *   queryKey: queryKeys.profiles.list()
 *   queryKey: queryKeys.profiles.detail(profileId)
 *   queryClient.invalidateQueries({ queryKey: queryKeys.profiles.list() })
 *
 * Reference: https://tkdodo.eu/blog/effective-react-query-keys
 */

import type { HistoryQuery } from '@/lib/api/types';

export const queryKeys = {
  // ========================================================================
  // Profiles
  // ========================================================================
  profiles: {
    all: () => ['profiles'] as const,
    lists: () => [{ scope: 'profiles', type: 'list' }] as const,
    list: () => ['profiles'] as const,
    details: () => [{ scope: 'profiles', type: 'detail' }] as const,
    detail: (profileId: string) => ['profiles', profileId] as const,
    samples: () => [{ scope: 'profiles', type: 'samples' }] as const,
    samplesList: (profileId: string) => ['profiles', profileId, 'samples'] as const,
  },

  // ========================================================================
  // Stories
  // ========================================================================
  stories: {
    all: () => ['stories'] as const,
    lists: () => [{ scope: 'stories', type: 'list' }] as const,
    list: () => ['stories'] as const,
    details: () => [{ scope: 'stories', type: 'detail' }] as const,
    detail: (storyId: string) => ['stories', storyId] as const,
  },

  // ========================================================================
  // History (Generations)
  // ========================================================================
  history: {
    all: () => ['history'] as const,
    lists: () => [{ scope: 'history', type: 'list' }] as const,
    list: (query?: HistoryQuery) => ['history', query] as const,
    details: () => [{ scope: 'history', type: 'detail' }] as const,
    detail: (generationId: string) => ['history', generationId] as const,
  },

  // ========================================================================
  // Server
  // ========================================================================
  server: {
    all: () => ['server'] as const,
    health: (serverUrl: string) => ['server', 'health', serverUrl] as const,
  },

  // ========================================================================
  // UI State (non-cached, for consistency)
  // ========================================================================
  ui: {
    all: () => ['ui'] as const,
  },
} as const;

/**
 * Type-safe query key helper
 * Ensures all invalidation queries use the correct key format
 *
 * Example:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.profiles.list() })
 */
export type QueryKeyFactory = typeof queryKeys;
