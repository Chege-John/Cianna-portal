import dotenv from "dotenv";
dotenv.config();

async function testActions() {
  const { db } = await import("./lib/db");
  const schema = await import("./lib/db/schema");
  const { createInvoiceAction } = await import("./server-actions/school");
  const { initiatePaymentAction } = await import("./server-actions/payments");

  try {
    console.log("Fetching a student user from DB...");
    const student = await db.select().from(schema.user).limit(1);
    
    if (student.length === 0) {
      console.log("No users found in database. Creating a test student user...");
      const testUserId = `u_${Date.now()}`;
      await db.insert(schema.user).values({
        id: testUserId,
        name: "Test Student",
        email: `test_${Date.now()}@example.com`,
        emailVerified: true,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      student.push({ id: testUserId } as any);
    }

    const studentId = student[0].id;
    console.log(`Using student ID: ${studentId}`);

    console.log("\n--- Testing createInvoiceAction ---");
    const amount = 30000;
    const description = "Test Course Enrollment Fee";
    
    let invoiceId: string;
    try {
      invoiceId = await createInvoiceAction(studentId, amount, description);
      console.log(`[SUCCESS] Invoice created successfully! Invoice ID: ${invoiceId}`);
    } catch (err: any) {
      console.error("[FAIL] createInvoiceAction failed with error:");
      console.error(err);
      return;
    }

    console.log("\n--- Testing initiatePaymentAction ---");
    const orderId = `INV_${invoiceId}_${Date.now()}`;
    const paymentData = {
      amount: amount,
      phoneNumber: "254712345678",
      orderId: orderId,
      bankName: "Equity",
      accountReference: "CIANNA-PORTAL",
      callbackUrl: "http://localhost:3000/api/payments/callback"
    };

    try {
      console.log("Calling initiatePaymentAction with payload:", paymentData);
      const res = await initiatePaymentAction(paymentData);
      console.log("[SUCCESS] initiatePaymentAction returned successfully! Gateway Response:", res);
    } catch (err: any) {
      console.error("[FAIL] initiatePaymentAction failed with error:");
      console.error(err);
    }

  } catch (err: any) {
    console.error("General test script failure:", err.message || err);
  }
}

testActions();
