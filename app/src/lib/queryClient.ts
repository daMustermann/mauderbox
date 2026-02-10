import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized QueryClient configuration for the entire application.
 * Used by both Tauri Desktop and web deployments.
 * 
 * Configure caching, retry, and refetch behavior here.
 * Changes apply automatically to all app instances.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Singleton instance for use throughout the app
export const queryClient = createQueryClient();
