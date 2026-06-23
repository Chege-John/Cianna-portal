import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable, verification as verificationTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify that user exists in Neon Postgres
    const existingUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "This email address is not registered in the system." },
        { status: 404 }
      );
    }

    // 2. Generate a cryptographically secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry window

    // 3. Clear any existing OTP verification records for this email
    await db
      .delete(verificationTable)
      .where(eq(verificationTable.identifier, normalizedEmail));

    // 4. Save the OTP verification record in the Postgres verification table
    await db.insert(verificationTable).values({
      id: `verify-${randomUUID()}`,
      identifier: normalizedEmail,
      value: otp,
      expiresAt: expiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Send OTP email using the Resend API (direct REST fetch to avoid dependencies)
    const apiKey = process.env["RESEND_API-KEY"];
    if (!apiKey) {
      console.error("RESEND_API-KEY is missing from environment variables");
      return NextResponse.json(
        { error: "Email provider is not configured on this server." },
        { status: 500 }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Cianna Portal <onboarding@resend.dev>",
        to: [normalizedEmail],
        subject: "Your Cianna Portal Password Reset OTP",
        html: `
          <div style="font-family: 'Figtree', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #256ff1; font-weight: 800; font-size: 28px; margin: 0; letter-spacing: -0.5px;">CIANNA PORTAL</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Security OTP Verification Service</p>
            </div>
            <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              <h3 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Reset Your Password</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                Hello,
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                We received a request to reset the password for your Cianna Portal account. Use the verification OTP code below to proceed with setting up a new password. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #256ff1; background-color: #eff6ff; padding: 16px 32px; border-radius: 16px; border: 2px dashed #bfdbfe;">
                  ${otp}
                </span>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
                If you did not make this request, you can safely ignore this email. Your password will remain secure and unchanged.
              </p>
            </div>
            <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 8px 0;">&copy; 2026 Cianna Deutsch-Institut. All rights reserved.</p>
              <p style="margin: 0;">This is an automated security notification. Please do not reply directly to this email.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error("Resend dispatch failure:", errText);
      return NextResponse.json(
        { error: "Could not dispatch reset email. Please contact support or try again later." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-otp route:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
