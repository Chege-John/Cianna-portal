import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, lte, lt, asc } from "drizzle-orm";
import { sendPaymentConfirmationEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Secure endpoint to be triggered by cron / scheduler
export async function GET(req: Request) {
  // Simple check for authorization key if configured, otherwise allow for development
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processedEvents: any[] = [];
  const failedEvents: any[] = [];

  try {
    // 1. Fetch pending outbox events inside a fast pessimistic transaction
    const eventsToProcess = await db.transaction(async (tx) => {
      const selected = await tx
        .select()
        .from(schema.outboxEvent)
        .where(
          and(
            eq(schema.outboxEvent.status, "PENDING"),
            lte(schema.outboxEvent.scheduledAt, new Date()),
            lt(schema.outboxEvent.attempts, 5)
          )
        )
        .orderBy(asc(schema.outboxEvent.scheduledAt))
        .limit(10)
        .for("update", { skipLocked: true });

      if (selected.length === 0) return [];

      // Immediately mark them as PROCESSING to unlock other workers
      for (const event of selected) {
        await tx
          .update(schema.outboxEvent)
          .set({
            status: "PROCESSING",
            attempts: event.attempts + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.outboxEvent.id, event.id));
      }

      return selected;
    });

    if (eventsToProcess.length === 0) {
      return NextResponse.json({ message: "No pending outbox events to process" });
    }

    // 2. Process each event individually outside of the lock transaction
    for (const event of eventsToProcess) {
      try {
        const payload = JSON.parse(event.payload);

        if (event.eventType === "payment.succeeded") {
          const { invoiceId, amountPaid, receiptNumber } = payload;

          // Fetch invoice
          const [inv] = await db
            .select()
            .from(schema.invoice)
            .where(eq(schema.invoice.id, invoiceId))
            .limit(1);

          if (inv) {
            // Fetch student user
            const [studentUser] = await db
              .select()
              .from(schema.user)
              .where(eq(schema.user.id, inv.studentId))
              .limit(1);

            if (studentUser) {
              // Fetch student profile
              const [profile] = await db
                .select()
                .from(schema.studentProfile)
                .where(eq(schema.studentProfile.id, inv.studentId))
                .limit(1);

              const studentName = profile
                ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                : (studentUser.name || "Student");

              const currentPaid = Number(inv.paidAmount) || 0;
              const remainingBalance = Math.max(0, Number(inv.amount) - currentPaid);

              // Dispatch payment confirmation email
              await sendPaymentConfirmationEmail({
                email: studentUser.email,
                name: studentName,
                invoiceId: inv.id,
                amountPaid: Number(amountPaid),
                receiptNumber: receiptNumber,
                balance: remainingBalance,
              });
            } else {
              console.warn(`[Outbox Worker] No user found for studentId ${inv.studentId} on event ${event.id}`);
            }
          } else {
            console.warn(`[Outbox Worker] No invoice found for invoiceId ${invoiceId} on event ${event.id}`);
          }
        } else if (event.eventType === "payment.failed") {
          // Log or dispatch alert for payment failure if desired
          console.log(`[Outbox Worker] Payment failed logged to outbox:`, payload);
        }

        // Mark as COMPLETED
        await db
          .update(schema.outboxEvent)
          .set({
            status: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(schema.outboxEvent.id, event.id));

        processedEvents.push(event.id);
      } catch (err: any) {
        console.error(`Error processing outbox event ${event.id}:`, err);

        // Calculate backoff delay: 1 min, 2 min, 4 min, 8 min, etc.
        const backoffMinutes = Math.pow(2, event.attempts); // attempts has already been incremented by 1
        const nextSchedule = new Date(Date.now() + 1000 * 60 * backoffMinutes);

        // Put back to PENDING (or mark FAILED if we reached max attempts)
        const newStatus = event.attempts >= 4 ? "FAILED" : "PENDING";

        await db
          .update(schema.outboxEvent)
          .set({
            status: newStatus,
            scheduledAt: nextSchedule,
            updatedAt: new Date(),
          })
          .where(eq(schema.outboxEvent.id, event.id));

        failedEvents.push({ id: event.id, error: err.message || String(err) });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedEvents.length} events`,
      processed: processedEvents,
      failed: failedEvents,
    });
  } catch (error: any) {
    console.error("Outbox worker execution failure:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
