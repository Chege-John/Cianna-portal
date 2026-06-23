import { createAuthClient } from "better-auth/react";

// Initialize client-side Better Auth SDK
export const authClient = createAuthClient({
  // Setting base URL dynamically so that both client-side, SSR, and local development are aligned
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});
