import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable, verification as verificationTable, account as accountTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { scryptSync, randomBytes } from "node:crypto";

// Helper to hash passwords using Better Auth's expected scrypt format (salt:key)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP code, and new password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Fetch user to verify account association
    const existingUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    const matchedUser = existingUsers[0];

    // 2. Fetch active OTP record
    const activeVerifications = await db
      .select()
      .from(verificationTable)
      .where(
        and(
          eq(verificationTable.identifier, normalizedEmail),
          eq(verificationTable.value, cleanOtp)
        )
      )
      .limit(1);

    if (activeVerifications.length === 0) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please enter the correct code." },
        { status: 400 }
      );
    }

    const verificationRecord = activeVerifications[0];

    // 3. Verify OTP expiration
    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 4. Hash the password and update in Neon Postgres account table
    const hashedPwd = hashPassword(newPassword);

    await db
      .update(accountTable)
      .set({
        password: hashedPwd,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accountTable.userId, matchedUser.id),
          eq(accountTable.providerId, "credential")
        )
      );

    // 5. Securely remove the spent verification token
    await db
      .delete(verificationTable)
      .where(eq(verificationTable.id, verificationRecord.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in verify-otp route:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
