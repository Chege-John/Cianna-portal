"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GATEWAY_BASE_URL = "https://payment.gateway.api.serix.co.ke/api/v1";

export async function getBanks() {
  const commonBanks = [
    "KCB", "Equity", "Coop", "ABSA", "Stanbic", "NCBA", 
    "Family", "I&M", "DTB", "Standard Chartered Bank"
  ];

  try {
    const response = await fetch(`${GATEWAY_BASE_URL}/banks`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) return commonBanks;
    
    const resBody = await response.json();
    if (resBody && Array.isArray(resBody.data)) {
      return resBody.data.map((b: any) => b.name);
    }
    return commonBanks;
  } catch (error) {
    console.error("Error fetching banks:", error);
    return commonBanks;
  }
}

export async function initiatePaymentAction(data: {
  amount: number;
  phoneNumber: string;
  orderId: string;
  bankName: string;
  accountReference: string;
  callbackUrl: string;
}) {
  const parts = data.orderId.split("_");
  const invoiceId = parts.length >= 2 ? parts[1] : null;
  const timestampPart = parts.length >= 3 ? parts[2] : String(Date.now());

  if (!invoiceId) {
    throw new Error("Invalid Order ID format: Missing Invoice ID");
  }

  const sessionId = `ps_${invoiceId}_${timestampPart}`;
  const idempotencyKey = `idemp_${invoiceId}_${timestampPart}`;

  // 1. Create PaymentSession and PaymentAttempt under strict transactional safety
  await db.transaction(async (tx) => {
    const [existingSession] = await tx
      .select()
      .from(schema.paymentSession)
      .where(eq(schema.paymentSession.idempotencyKey, idempotencyKey))
      .limit(1);

    if (!existingSession) {
      await tx.insert(schema.paymentSession).values({
        id: sessionId,
        invoiceId: invoiceId,
        amount: data.amount,
        currency: "KES",
        status: "CREATED",
        idempotencyKey: idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await tx.insert(schema.paymentAttempt).values({
      id: data.orderId,
      paymentSessionId: existingSession ? existingSession.id : sessionId,
      providerId: "SERIX_MPESA",
      paymentMethod: "STK_PUSH",
      phoneNumber: data.phoneNumber,
      amount: data.amount,
      status: "INITIATED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log the initial state event
    await tx.insert(schema.paymentEvent).values({
      id: `pe_${Date.now()}`,
      paymentSessionId: existingSession ? existingSession.id : sessionId,
      paymentAttemptId: data.orderId,
      eventType: "PaymentAttemptCreated_Initiated",
      payload: JSON.stringify({ data, idempotencyKey }),
      correlationId: data.orderId,
      createdAt: new Date(),
    });
  });

  // 2. Dispatch network call to Serix (strictly outside active SQL transactions)
  try {
    const response = await fetch(`${GATEWAY_BASE_URL}/init-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Payment initiation failed");
    }

    const gatewayResponse = await response.json();
    const providerRef = gatewayResponse.CheckoutRequestID || gatewayResponse.checkoutRequestId || gatewayResponse.MerchantRequestID || null;

    // 3. Update Status to PENDING_CALLBACK & record provider reference in a fast transaction
    await db.transaction(async (tx) => {
      await tx
        .update(schema.paymentAttempt)
        .set({
          status: "PENDING_CALLBACK",
          providerReference: providerRef,
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentAttempt.id, data.orderId));

      await tx
        .update(schema.paymentSession)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(eq(schema.paymentSession.id, sessionId));

      await tx.insert(schema.paymentEvent).values({
        id: `pe_${Date.now()}`,
        paymentSessionId: sessionId,
        paymentAttemptId: data.orderId,
        eventType: "STKPushSent_PendingCallback",
        payload: JSON.stringify(gatewayResponse),
        correlationId: data.orderId,
        createdAt: new Date(),
      });
    });

    return gatewayResponse;

  } catch (error: any) {
    console.error("Error initiating payment gateway call:", error);
    
    // 4. Mark attempt as FAILED if network call or validation rejected in a fast transaction
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(schema.paymentAttempt)
          .set({
            status: "FAILED",
            errorMessage: error.message || "Failed to initiate",
            updatedAt: new Date(),
          })
          .where(eq(schema.paymentAttempt.id, data.orderId));

        await tx
          .update(schema.paymentSession)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(schema.paymentSession.id, sessionId));

        await tx.insert(schema.paymentEvent).values({
          id: `pe_${Date.now()}`,
          paymentSessionId: sessionId,
          paymentAttemptId: data.orderId,
          eventType: "PaymentAttemptFailed_InitiationError",
          payload: JSON.stringify({ error: error.message || String(error) }),
          correlationId: data.orderId,
          createdAt: new Date(),
        });
      });
    } catch (dbErr) {
      console.error("Failed to write fail-state update (non-fatal inside parent error):", dbErr);
    }

    throw error;
  }
}

export async function getPaymentSettings() {
  const settings = await db.select().from(schema.paymentSettings).limit(1);
  if (settings[0]) return settings[0];
  
  // Return default settings if none exist, so users and admins can use the gateway out of the box
  return {
    id: "ps-default",
    bankName: "Equity",
    accountReference: "CIANNA-PORTAL",
    callbackUrl: "SYSTEM_AUTO",
    updatedAt: new Date()
  };
}

export async function updatePaymentSettingsAction(data: {
  bankName: string;
  accountReference: string;
}) {
  const existing = await getPaymentSettings();

  if (existing) {
    await db
      .update(schema.paymentSettings)
      .set({
        bankName: data.bankName,
        accountReference: data.accountReference,
        callbackUrl: "SYSTEM_AUTO",
        updatedAt: new Date(),
      })
      .where(eq(schema.paymentSettings.id, existing.id));
  } else {
    await db.insert(schema.paymentSettings).values({
      id: `ps-${Date.now()}`,
      bankName: data.bankName,
      accountReference: data.accountReference,
      callbackUrl: "SYSTEM_AUTO",
      updatedAt: new Date(),
    });
  }

  return { success: true };
}
