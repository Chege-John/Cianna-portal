import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export standard Next.js App Router handlers for both GET and POST HTTP methods
export const { GET, POST } = toNextJsHandler(auth);
