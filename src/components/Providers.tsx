"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create stateful QueryClient to prevent recreation during re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Keep data fresh for 1 minute before refetching
            refetchOnWindowFocus: false, // Turn off aggressive refetches on tab focus
            retry: 1, // Fail fast on network errors for better developer experience
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
