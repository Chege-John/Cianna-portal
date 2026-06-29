import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface CallbackPayload {
  orderId: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceiptNumber: string | null;
}

export async function processPaymentCallback(payload: CallbackPayload) {
  return await db.transaction(async (tx) => {
    // 1. Acquire pessimistic lock on the payment attempt row
    const [attempt] = await tx
      .select()
      .from(schema.paymentAttempt)
      .where(eq(schema.paymentAttempt.id, payload.orderId))
      .for("update"); // PostgreSQL pessimistic lock (SELECT FOR UPDATE)

    if (!attempt) {
      throw new Error(`Payment attempt not found: ${payload.orderId}`);
    }

    // 2. Early-exit if already processed (Idempotency)
    if (attempt.status === "SUCCESS") {
      return { success: true, message: "Already processed", alreadyProcessed: true };
    }

    // 3. Select and lock the associated payment session row
    const [session] = await tx
      .select()
      .from(schema.paymentSession)
      .where(eq(schema.paymentSession.id, attempt.paymentSessionId))
      .for("update");

    if (!session) {
      throw new Error(`Payment session not found: ${attempt.paymentSessionId}`);
    }

    const isSuccess = payload.resultCode === 0;

    if (isSuccess) {
      // 4. Update the payment attempt
      await tx
        .update(schema.paymentAttempt)
        .set({
          status: "SUCCESS",
          providerReceipt: payload.mpesaReceiptNumber,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentAttempt.id, attempt.id));

      // 5. Update the payment session
      await tx
        .update(schema.paymentSession)
        .set({
          status: "SUCCEEDED",
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentSession.id, session.id));

      // 6. Create IMMUTABLE Ledger entry (Credit)
      const ledgerId = `le_${Date.now()}`;
      await tx.insert(schema.ledgerEntry).values({
        id: ledgerId,
        invoiceId: session.invoiceId,
        paymentAttemptId: attempt.id,
        amount: attempt.amount,
        entryType: "CREDIT",
        reference: payload.mpesaReceiptNumber || "M-PESA SUCCESS",
        createdAt: new Date(),
      });

      // 7. Insert to legacy paymentLog for backwards-compatibility
      await tx.insert(schema.paymentLog).values({
        id: `pay-${Date.now()}`,
        invoiceId: session.invoiceId,
        amount: attempt.amount,
        paymentMethod: "M-PESA (via Serix)",
        transactionReference: payload.mpesaReceiptNumber,
        date: new Date().toISOString().split("T")[0],
      });

      // 8. Lock parent invoice row
      const [invoice] = await tx
        .select()
        .from(schema.invoice)
        .where(eq(schema.invoice.id, session.invoiceId))
        .for("update");

      if (!invoice) {
        throw new Error(`Invoice not found: ${session.invoiceId}`);
      }

      // 9. Update Invoice status atomically based on cumulative ledger total
      const [sumQuery] = await tx
        .select({
          totalCredited: sql<number>`COALESCE(SUM(${schema.ledgerEntry.amount}), 0)`,
        })
        .from(schema.ledgerEntry)
        .where(
          and(
            eq(schema.ledgerEntry.invoiceId, session.invoiceId),
            eq(schema.ledgerEntry.entryType, "CREDIT")
          )
        );

      const totalCredited = Number(sumQuery?.totalCredited || 0);
      
      let newStatus: "Paid" | "Unpaid" | "Partially Paid" = "Partially Paid";
      if (totalCredited >= Number(invoice.amount)) {
        newStatus = "Paid";
      } else if (totalCredited <= 0) {
        newStatus = "Unpaid";
      }

      await tx
        .update(schema.invoice)
        .set({
          status: newStatus,
          paidAmount: totalCredited,
        })
        .where(eq(schema.invoice.id, session.invoiceId));

      // 10. Queue event to transactional outbox (no external network operations)
      await tx.insert(schema.outboxEvent).values({
        id: `outbox_${Date.now()}`,
        aggregateType: "payment",
        aggregateId: session.invoiceId,
        eventType: "payment.succeeded",
        payload: JSON.stringify({
          invoiceId: session.invoiceId,
          amountPaid: attempt.amount,
          receiptNumber: payload.mpesaReceiptNumber || "M-PESA SUCCESS",
          attemptId: attempt.id,
        }),
        status: "PENDING",
        attempts: 0,
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 11. Log structured payment event locally
      await tx.insert(schema.paymentEvent).values({
        id: `pe_${Date.now()}`,
        paymentSessionId: session.id,
        paymentAttemptId: attempt.id,
        eventType: "CallbackReceived_Success",
        payload: JSON.stringify(payload),
        correlationId: attempt.id,
        createdAt: new Date(),
      });

      return { 
        success: true, 
        invoiceId: session.invoiceId, 
        status: newStatus, 
        amount: attempt.amount 
      };

    } else {
      // Handle Failure / Cancel transitions
      const isCancelled = payload.resultCode === 1032;
      const attemptStatus: "REJECTED" | "FAILED" = isCancelled ? "REJECTED" : "FAILED";

      await tx
        .update(schema.paymentAttempt)
        .set({
          status: attemptStatus,
          errorMessage: payload.resultDesc,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentAttempt.id, attempt.id));

      await tx
        .update(schema.paymentSession)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentSession.id, session.id));

      // Queue event to transactional outbox for failure propagation
      await tx.insert(schema.outboxEvent).values({
        id: `outbox_${Date.now()}`,
        aggregateType: "payment",
        aggregateId: session.invoiceId,
        eventType: "payment.failed",
        payload: JSON.stringify({
          invoiceId: session.invoiceId,
          errorMessage: payload.resultDesc,
          attemptId: attempt.id,
          status: attemptStatus,
        }),
        status: "PENDING",
        attempts: 0,
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Log structured payment event locally
      await tx.insert(schema.paymentEvent).values({
        id: `pe_${Date.now()}`,
        paymentSessionId: session.id,
        paymentAttemptId: attempt.id,
        eventType: `CallbackReceived_${attemptStatus}`,
        payload: JSON.stringify(payload),
        correlationId: attempt.id,
        createdAt: new Date(),
      });

      return { 
        success: false, 
        invoiceId: session.invoiceId, 
        status: attemptStatus, 
        errorMessage: payload.resultDesc 
      };
    }
  });
}
