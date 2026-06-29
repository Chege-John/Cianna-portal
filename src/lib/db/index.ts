import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL environment variable is missing. Database connections will fail.");
}

// Create SQL connection client using Neon Serverless WebSocket Pool driver
const pool = new Pool({ connectionString: databaseUrl || "" });

// Initialize Drizzle ORM instance with custom schemas
export const db = drizzle(pool, { schema });

