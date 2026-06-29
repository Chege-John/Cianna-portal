import dotenv from "dotenv";
dotenv.config();

async function test() {
  console.log("Database URL present:", !!process.env.DATABASE_URL);
  
  const { db } = await import("./lib/db");
  const schema = await import("./lib/db/schema");

  const tables = [
    { name: "user", table: schema.user },
    { name: "invoice", table: schema.invoice },
    { name: "ledgerEntry", table: schema.ledgerEntry },
    { name: "paymentSession", table: schema.paymentSession },
    { name: "paymentAttempt", table: schema.paymentAttempt },
    { name: "paymentEvent", table: schema.paymentEvent },
    { name: "outboxEvent", table: schema.outboxEvent },
    { name: "paymentSettings", table: schema.paymentSettings },
  ];

  for (const t of tables) {
    try {
      const res = await db.select().from(t.table).limit(1);
      console.log(`[SUCCESS] Table '${t.name}' is queried successfully. Count: ${res.length}`);
    } catch (err: any) {
      console.error(`[FAIL] Table '${t.name}' query failed:`, err.message || err);
    }
  }
}

test();
