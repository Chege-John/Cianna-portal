import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "@neondatabase/serverless";

dotenv.config();

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is missing from environment variables.");
    return;
  }

  const sqlFilePath = path.join(process.cwd(), "drizzle", "0001_colorful_susan_delgado.sql");
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Migration file not found at: ${sqlFilePath}`);
    return;
  }

  console.log(`📖 Reading migration file: ${sqlFilePath}`);
  const rawSql = fs.readFileSync(sqlFilePath, "utf8");

  // Split queries by drizzle's statement breakpoint
  const queries = rawSql
    .split("--> statement-breakpoint")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  console.log(`🔗 Connecting to Neon database using WebSocket Client...`);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  console.log(`🚀 Executing ${queries.length} SQL statements...`);
  
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const snippet = query.split("\n")[0].substring(0, 80) + "...";
    console.log(`\nExecuting statement ${i + 1}/${queries.length}: "${snippet}"`);
    
    try {
      await client.query(query);
      console.log(`✅ Statement ${i + 1} executed successfully.`);
      successCount++;
    } catch (err: any) {
      // If table/column already exists, we can treat it as a skip (non-fatal)
      const msg = err.message || String(err);
      if (
        msg.includes("already exists") || 
        msg.includes("duplicate column") || 
        msg.includes("duplicate key") ||
        msg.includes("already a foreign key")
      ) {
        console.warn(`⚠️ Warning (Skipping): ${msg}`);
        skippedCount++;
      } else {
        console.error(`❌ Error executing statement ${i + 1}:`, err);
        failedCount++;
      }
    }
  }

  await client.end();

  console.log("\n==========================================");
  console.log(`🏁 Migration run complete!`);
  console.log(`✅ Successfully executed: ${successCount}`);
  console.log(`⚠️ Skipped (already existed): ${skippedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log("==========================================");
}

runMigrations();
