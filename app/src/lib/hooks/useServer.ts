import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useServerStore } from '@/stores/serverStore';

export function useServerHealth() {
  const serverUrl = useServerStore((state) => state.serverUrl);

  return useQuery({
    queryKey: queryKeys.server.health(serverUrl),
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });
}
