import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { pusherServer } from "@/lib/pusher";
import { processPaymentCallback } from "@/lib/payments/engine";

export async function POST(req: Request) {
  const correlationId = req.headers.get("x-correlation-id") || `corr_${Date.now()}`;
  console.log(`[${correlationId}] Incoming payment gateway callback`);

  try {
    const body = await req.json();
    console.log(`[${correlationId}] Serix Callback Payload:`, JSON.stringify(body));

    const data = body.data || {};

    // 1. Acknowledge and early-exit on "payment.initiated" (it is not a completion webhook)
    const event = body.event || data.eventType || "";
    if (event === "payment.initiated" || event === "payment_initiated") {
      console.log(`[${correlationId}] Received payment initiation webhook. Handled and returning early.`);
      return NextResponse.json({
        status: "SUCCESS",
        message: "Payment initiation webhook acknowledged",
        traceId: correlationId,
      });
    }

    // 2. Extract transaction identifiers (supporting both flat structure and Serix's nested data structure)
    const rawOrderId = body.orderId || body.OrderId || body.order_id || body.reference || data.orderId || data.OrderId || data.order_id || data.reference || "";
    const rawStatus = body.status || body.Status || data.status || data.Status || data.finalStatus || "";
    const resultCodeRaw = body.ResultCode !== undefined 
      ? body.ResultCode 
      : (data.safaricomResultCode !== undefined 
          ? data.safaricomResultCode 
          : (data.resultCode !== undefined 
              ? data.resultCode 
              : (body.Body?.stkCallback?.ResultCode)));

    const resultDesc = body.ResultDesc 
      || (body.Body?.stkCallback?.ResultDesc) 
      || body.message 
      || data.ResultDesc 
      || data.safaricomResultDesc 
      || data.resultDescription 
      || data.message 
      || "Transaction cancelled or failed";

    let providerRef = body.CheckoutRequestID || body.checkoutRequestId || body.MerchantRequestID || data.CheckoutRequestID || data.checkoutRequestId || data.merchantRequestId || body.Body?.stkCallback?.CheckoutRequestID || null;

    let existingAttempt = null;

    // 3. Locate the PaymentAttempt record in the DB
    if (rawOrderId) {
      const [attempt] = await db
        .select()
        .from(schema.paymentAttempt)
        .where(eq(schema.paymentAttempt.id, String(rawOrderId)))
        .limit(1);
      existingAttempt = attempt;
    }

    if (!existingAttempt && providerRef) {
      const [attempt] = await db
        .select()
        .from(schema.paymentAttempt)
        .where(eq(schema.paymentAttempt.providerReference, String(providerRef)))
        .limit(1);
      existingAttempt = attempt;
    }

    if (!existingAttempt) {
      console.warn(`[${correlationId}] Webhook mapping failed: No PaymentAttempt found for Order ID [${rawOrderId}] or Provider Ref [${providerRef}]`);
      return NextResponse.json({ error: "Transaction attempt not found" }, { status: 404 });
    }

    // 4. Map status codes
    const isSuccess = 
      rawStatus === "SUCCESS" || 
      rawStatus === "success" || 
      rawStatus === "COMPLETED" || 
      rawStatus === "completed" || 
      resultCodeRaw === 0 || 
      resultCodeRaw === "0";

    const resultCode = isSuccess ? 0 : (resultCodeRaw !== undefined ? Number(resultCodeRaw) : 1);

    // Extract Safaricom M-PESA Receipt Number
    let mpesaReceipt = body.MpesaReceiptNumber || body.reference || data.mpesaReceiptNumber || data.transactionReference || null;
    if (!mpesaReceipt && body.Body?.stkCallback?.CallbackMetadata?.Item) {
      const items = body.Body.stkCallback.CallbackMetadata.Item;
      const receiptItem = items.find((item: any) => item.Name === "MpesaReceiptNumber");
      if (receiptItem) {
        mpesaReceipt = receiptItem.Value;
      }
    }

    // 3. Process callback inside the atomic transactional engine (Locks rows, Ledger entries, Outbox events)
    const result = await processPaymentCallback({
      orderId: existingAttempt.id,
      resultCode,
      resultDesc,
      mpesaReceiptNumber: mpesaReceipt ? String(mpesaReceipt) : null,
    });

    // 4. Trigger client real-time notification outside of the database transaction
    const invoiceId = result.invoiceId;
    if (result.success) {
      await pusherServer.trigger(`invoice-${invoiceId}`, "payment-completed", {
        invoiceId,
        status: result.status,
        amountPaid: result.amount,
      });
    } else {
      await pusherServer.trigger(`invoice-${invoiceId}`, "payment-failed", {
        invoiceId,
        status: "Failed",
        message: result.errorMessage || resultDesc,
      });
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: "Webhook callback processed and synchronized",
      traceId: correlationId,
    });

  } catch (error: any) {
    console.error(`[${correlationId}] Webhook processing failed:`, error);
    return NextResponse.json({
      error: "Internal Processing Failure",
      traceId: correlationId,
    }, { status: 500 });
  }
}
