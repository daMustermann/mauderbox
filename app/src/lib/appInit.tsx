import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

/**
 * Centralized App Provider Wrapper
 * 
 * Wraps the entire application with required providers:
 * - QueryClientProvider: React Query for server state management
 * 
 * Usage:
 *   <AppProviders>
 *     <App />
 *   </AppProviders>
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </React.StrictMode>
  );
}
