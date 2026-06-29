import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

// Secure endpoint to be triggered by cron / scheduler
export async function GET(req: Request) {
  // Simple check for authorization key if configured, otherwise allow for development
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reconciled: any[] = [];
  const failedToReconcile: any[] = [];

  try {
    // Find payment attempts that have been pending for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckAttempts = await db
      .select({
        attempt: schema.paymentAttempt,
        session: schema.paymentSession,
      })
      .from(schema.paymentAttempt)
      .innerJoin(
        schema.paymentSession,
        eq(schema.paymentAttempt.paymentSessionId, schema.paymentSession.id)
      )
      .where(
        and(
          eq(schema.paymentAttempt.status, "PENDING_CALLBACK"),
          lte(schema.paymentAttempt.createdAt, fiveMinutesAgo)
        )
      )
      .limit(10); // Batch size

    if (stuckAttempts.length === 0) {
      return NextResponse.json({ message: "No stuck payment attempts to reconcile" });
    }

    const GATEWAY_BASE_URL = "https://payment.gateway.api.serix.co.ke/api/v1";

    for (const { attempt, session } of stuckAttempts) {
      const invoiceId = session.invoiceId;
      try {
        // Fetch status from Serix API
        const response = await fetch(`${GATEWAY_BASE_URL}/query-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: attempt.id,
          }),
        });

        if (!response.ok) {
          // If the network request failed, we check if the attempt is older than 1 hour.
          // If older than 1 hour, auto-expire it to prevent locking.
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (attempt.createdAt < oneHourAgo) {
            await db.transaction(async (tx) => {
              await tx
                .update(schema.paymentAttempt)
                .set({
                  status: "TIMEOUT",
                  errorMessage: "Gateway status query failed and attempt timed out",
                  updatedAt: new Date(),
                })
                .where(eq(schema.paymentAttempt.id, attempt.id));

              await tx
                .update(schema.paymentSession)
                .set({
                  status: "EXPIRED",
                  updatedAt: new Date(),
                })
                .where(eq(schema.paymentSession.id, attempt.paymentSessionId));
              
              // Log event
              await tx.insert(schema.paymentEvent).values({
                id: `pe_${Date.now()}`,
                paymentSessionId: attempt.paymentSessionId,
                paymentAttemptId: attempt.id,
                eventType: "AttemptExpired_Timeout",
                payload: JSON.stringify({ reason: "Reconciliation query failed on expired transaction" }),
                correlationId: attempt.id,
                createdAt: new Date(),
              });
            });
            reconciled.push({ id: attempt.id, status: "TIMEOUT" });
          } else {
            failedToReconcile.push({ id: attempt.id, reason: `Gateway responded with HTTP ${response.status}` });
          }
          continue;
        }

        const data = await response.json();
        const rawStatus = data.status || data.Status || "";
        const resultCode = data.ResultCode !== undefined ? data.ResultCode : (data.Body?.stkCallback?.ResultCode);
        const isSuccess = rawStatus === "SUCCESS" || rawStatus === "success" || resultCode === 0 || resultCode === "0";

        if (isSuccess) {
          const mpesaReceipt = data.MpesaReceiptNumber || data.reference || data.Body?.stkCallback?.CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "RECONCILED";

          await db.transaction(async (tx) => {
            // 1. Double check attempt isn't already processed (concurrency check)
            const [freshAttempt] = await tx
              .select()
              .from(schema.paymentAttempt)
              .where(eq(schema.paymentAttempt.id, attempt.id))
              .for("update");

            if (freshAttempt.status === "SUCCESS") return;

            // 2. Update payment attempt to success
            await tx
              .update(schema.paymentAttempt)
              .set({
                status: "SUCCESS",
                providerReceipt: mpesaReceipt,
                updatedAt: new Date(),
              })
              .where(eq(schema.paymentAttempt.id, attempt.id));

            // 3. Update payment session to succeeded
            await tx
              .update(schema.paymentSession)
              .set({
                status: "SUCCEEDED",
                updatedAt: new Date(),
              })
              .where(eq(schema.paymentSession.id, attempt.paymentSessionId));

            // 4. Resolve Invoice and update
            const [existingInvoice] = await tx
              .select()
              .from(schema.invoice)
              .where(eq(schema.invoice.id, invoiceId))
              .for("update");

            if (existingInvoice && existingInvoice.status !== "Paid") {
              const amountPaid = attempt.amount;
              const currentPaid = Number(existingInvoice.paidAmount) || 0;
              const newTotalPaid = currentPaid + amountPaid;
              
              let newStatus: "Paid" | "Unpaid" | "Partially Paid" = "Partially Paid";
              if (newTotalPaid >= Number(existingInvoice.amount)) {
                newStatus = "Paid";
              }

              await tx
                .update(schema.invoice)
                .set({
                  status: newStatus,
                  paidAmount: newTotalPaid,
                })
                .where(eq(schema.invoice.id, invoiceId));

              // Insert standard payment log
              await tx.insert(schema.paymentLog).values({
                id: `pay_${Date.now()}`,
                invoiceId: invoiceId,
                amount: amountPaid,
                paymentMethod: "M-PESA (via Serix Reconciliation)",
                transactionReference: mpesaReceipt,
                date: new Date().toISOString().split("T")[0],
              });

              // Insert Ledger Entry
              await tx.insert(schema.ledgerEntry).values({
                id: `le_${Date.now()}`,
                invoiceId: invoiceId,
                paymentAttemptId: attempt.id,
                amount: amountPaid,
                entryType: "CREDIT",
                reference: mpesaReceipt,
                createdAt: new Date(),
              });

              // Log Event
              await tx.insert(schema.paymentEvent).values({
                id: `pe_${Date.now()}`,
                paymentSessionId: attempt.paymentSessionId,
                paymentAttemptId: attempt.id,
                eventType: "CallbackReconciled_Success",
                payload: JSON.stringify(data),
                correlationId: attempt.id,
                createdAt: new Date(),
              });

              // Insert Outbox event
              await tx.insert(schema.outboxEvent).values({
                id: `outbox_${Date.now()}`,
                aggregateType: "payment",
                aggregateId: invoiceId,
                eventType: "payment.succeeded",
                payload: JSON.stringify({
                  invoiceId: invoiceId,
                  amountPaid: amountPaid,
                  receiptNumber: mpesaReceipt,
                  attemptId: attempt.id,
                }),
                status: "PENDING",
                attempts: 0,
                scheduledAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              // Trigger Pusher
              await pusherServer.trigger(`invoice-${invoiceId}`, "payment-completed", {
                invoiceId: invoiceId,
                status: newStatus,
                amountPaid,
              });
            }
          });

          reconciled.push({ id: attempt.id, status: "SUCCESS" });
        } else {
          // Gateway returned failure or user cancellation
          const isCancelled = resultCode === 1032 || resultCode === "1032" || String(data.ResultDesc || "").toLowerCase().includes("cancel");
          const attemptStatus = isCancelled ? "REJECTED" : "FAILED";

          await db.transaction(async (tx) => {
            const [freshAttempt] = await tx
              .select()
              .from(schema.paymentAttempt)
              .where(eq(schema.paymentAttempt.id, attempt.id))
              .for("update");

            if (freshAttempt.status !== "PENDING_CALLBACK") return;

            await tx
              .update(schema.paymentAttempt)
              .set({
                status: attemptStatus,
                errorMessage: data.ResultDesc || "Gateway reported failure",
                updatedAt: new Date(),
              })
              .where(eq(schema.paymentAttempt.id, attempt.id));

            await tx
              .update(schema.paymentSession)
              .set({
                status: "FAILED",
                updatedAt: new Date(),
              })
              .where(eq(schema.paymentSession.id, attempt.paymentSessionId));

            // Log event
            await tx.insert(schema.paymentEvent).values({
              id: `pe_${Date.now()}`,
              paymentSessionId: attempt.paymentSessionId,
              paymentAttemptId: attempt.id,
              eventType: `CallbackReconciled_${attemptStatus}`,
              payload: JSON.stringify(data),
              correlationId: attempt.id,
              createdAt: new Date(),
            });

            // Trigger failed Pusher Event so client modal cancels itself out and resets
            await pusherServer.trigger(`invoice-${invoiceId}`, "payment-failed", {
              invoiceId: invoiceId,
              status: "Failed",
              message: data.ResultDesc || "Gateway reported failure",
            });
          });

          reconciled.push({ id: attempt.id, status: attemptStatus });
        }
      } catch (err: any) {
        console.error(`Error reconciling payment attempt ${attempt.id}:`, err);
        failedToReconcile.push({ id: attempt.id, error: err.message || String(err) });
      }
    }

    return NextResponse.json({
      message: `Reconciled ${reconciled.length} attempts`,
      reconciled,
      failed: failedToReconcile,
    });
  } catch (error: any) {
    console.error("Reconciliation worker execution failure:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
