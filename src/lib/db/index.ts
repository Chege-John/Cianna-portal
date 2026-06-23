import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL environment variable is missing. Database connections will fail.");
}

// Create SQL connection client using Neon Serverless HTTP driver
const sql = neon(databaseUrl || "");

// Initialize Drizzle ORM instance with custom schemas
export const db = drizzle(sql, { schema });
