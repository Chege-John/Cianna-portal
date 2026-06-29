"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sendEnrollmentEmail } from "@/lib/mail";
import { headers } from "next/headers";

export async function activateAccountAction(currentPassword: string, newPassword: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Update password in Better Auth
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword: newPassword,
        currentPassword: currentPassword,
      }
    });

    // 2. Clear the mustChangePassword flag
    await db
      .update(schema.user)
      .set({ mustChangePassword: false })
      .where(eq(schema.user.id, session.user.id));

    return { success: true };
  } catch (error: any) {
    console.error("Failed to activate account:", error);
    return { success: false, error: error.message || "Activation failed" };
  }
}

export async function getUsers() {
  return await db.select().from(schema.user);
}

export async function getSubjects() {
  return await db.select().from(schema.subject);
}

export async function getClassrooms() {
  return await db.select().from(schema.classroom);
}

export async function getClassroomSubjects() {
  return await db.select().from(schema.classroomSubject);
}

export async function getStudents() {
  return await db.select().from(schema.studentProfile);
}

export async function getTeachers() {
  return await db.select().from(schema.teacherProfile);
}

export async function getGrades() {
  return await db.select().from(schema.grade);
}

export async function getAttendance() {
  return await db.select().from(schema.attendanceRecord);
}

export async function getInvoices() {
  return await db.select().from(schema.invoice);
}

export async function getPayments() {
  return await db.select().from(schema.paymentLog);
}

export async function getAuditLogs() {
  return await db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.timestamp));
}

export async function addStudentAction(data: {
  name: string;
  email: string;
  classroomId: string;
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
  idNumber: string;
  profession: string;
  courseLevel: "A1" | "A2" | "B1" | "B2";
  schedule: "Online" | "Physical" | "Hybrid";
  phoneNumber: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  parentEmail?: string;
}) {
  // 1. Generate a temporary password (e.g., Cianna2026!)
  const tempPassword = `Cianna${Math.floor(1000 + Math.random() * 9000)}!`;

  // 2. Create the user via Better Auth API
  // This ensures password hashing and account linking are handled correctly
  const newUser = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: tempPassword,
      name: data.name,
      // @ts-ignore - Better Auth additional fields
      role: "student",
      mustChangePassword: true,
    }
  });

  if (!newUser) {
    throw new Error("Failed to create user account");
  }

  const studentId = newUser.user.id;

  // 3. Create the student profile
  await db.insert(schema.studentProfile).values({
    id: studentId,
    classroomId: data.classroomId,
    firstName: data.firstName,
    lastName: data.lastName,
    dob: data.dob,
    nationality: data.nationality,
    idNumber: data.idNumber,
    profession: data.profession,
    courseLevel: data.courseLevel,
    schedule: data.schedule,
    phoneNumber: data.phoneNumber,
    guardianName: data.guardianName,
    guardianRelationship: data.guardianRelationship,
    guardianPhone: data.guardianPhone,
    parentEmail: data.parentEmail || null,
  });

  // 4. Auto-generate the invoice based on course level
  const invoiceAmount = (data.courseLevel === "A1" || data.courseLevel === "A2") ? 30000 : 35000;
  const invoiceDesc = `${data.courseLevel} Course Enrollment Fee`;
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const invoiceId = `inv-${Date.now()}`;

  await db.transaction(async (tx) => {
    await tx.insert(schema.invoice).values({
      id: invoiceId,
      studentId,
      amount: invoiceAmount,
      paidAmount: 0,
      description: invoiceDesc,
      dueDate,
      status: "Unpaid",
      createdAt: new Date().toISOString().split("T")[0],
    });

    await tx.insert(schema.ledgerEntry).values({
      id: `le_${Date.now()}`,
      invoiceId: invoiceId,
      amount: invoiceAmount,
      entryType: "DEBIT",
      reference: "Invoice original charge on enrollment",
      createdAt: new Date(),
    });
  });

  // 5. Send Enrollment Email
  await sendEnrollmentEmail({
    email: data.email,
    name: data.name,
    tempPassword: tempPassword,
    role: "Student",
    invoice: {
      id: invoiceId,
      amount: invoiceAmount,
      dueDate,
      description: invoiceDesc,
    }
  });

  // 6. Audit Log
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Student enrolled, automatic invoice ${invoiceId} for ${invoiceAmount} KSh generated, and credentials emailed: ${data.name} (${data.email})`,
  });

  return studentId;
}

export async function addTeacherAction(name: string, email: string, subjectId: string) {
  const tempPassword = `Teacher${Math.floor(1000 + Math.random() * 9000)}!`;
  
  const newUser = await auth.api.signUpEmail({
    body: {
      email,
      password: tempPassword,
      name,
      // @ts-ignore
      role: "teacher",
      mustChangePassword: true,
    }
  });

  if (!newUser) throw new Error("Failed to create teacher account");
  
  const teacherId = newUser.user.id;

  await db.insert(schema.teacherProfile).values({
    id: teacherId,
    subjectId,
  });

  await sendEnrollmentEmail({
    email,
    name,
    tempPassword,
    role: "Teacher",
  });

  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Teacher enrolled & credentials emailed: ${name} (${email})`,
  });

  return teacherId;
}

export async function addClassroomAction(name: string, subjectIds: string[]) {
  const classId = `c-${Date.now()}`;
  await db.insert(schema.classroom).values({
    id: classId,
    name,
  });
  if (subjectIds.length > 0) {
    await db.insert(schema.classroomSubject).values(
      subjectIds.map((subjectId) => ({ classroomId: classId, subjectId }))
    );
  }
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Klassenraum erstellt: ${name}`,
  });
  return classId;
}

export async function createInvoiceAction(studentId: string, amount: number, description: string) {
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const invoiceId = `inv-${Date.now()}`;

  await db.transaction(async (tx) => {
    await tx.insert(schema.invoice).values({
      id: invoiceId,
      studentId,
      amount,
      description,
      dueDate,
      status: "Unpaid",
      createdAt: new Date().toISOString().split("T")[0],
    });

    await tx.insert(schema.ledgerEntry).values({
      id: `le_${Date.now()}`,
      invoiceId: invoiceId,
      amount: amount,
      entryType: "DEBIT",
      reference: `Invoice created: ${description}`,
      createdAt: new Date(),
    });

    await tx.insert(schema.auditLog).values({
      id: `l-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      role: "super-admin",
      action: `Rechnung erstellt: ${amount} EUR - ${description}`,
    });
  });

  return invoiceId;
}

export async function recordGradeAction(studentId: string, classroomId: string, subjectId: string, score: number, gradedBy: string) {
  await db.insert(schema.grade).values({
    id: `g-${Date.now()}`,
    studentId,
    classroomId,
    subjectId,
    score,
    gradedBy,
    date: new Date().toISOString().split("T")[0],
  });
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: gradedBy,
    role: "teacher",
    action: `Note eingetragen für ${studentId} in ${subjectId}: ${score}%`,
  });
}

export async function recordAttendanceAction(classroomId: string, date: string, records: { studentId: string; status: "Present" | "Absent" | "Late" }[]) {
  await db.delete(schema.attendanceRecord).where(
    and(
      eq(schema.attendanceRecord.classroomId, classroomId),
      eq(schema.attendanceRecord.date, date)
    )
  );
  if (records.length > 0) {
    await db.insert(schema.attendanceRecord).values(
      records.map((r, index) => ({
        id: `a-${Date.now()}-${index}`,
        studentId: r.studentId,
        classroomId,
        date,
        status: r.status,
      }))
    );
  }
}

export async function payInvoiceAction(invoiceId: string, paymentMethod: string, amount?: number, reference?: string) {
  await db.transaction(async (tx) => {
    const [inv] = await tx
      .select()
      .from(schema.invoice)
      .where(eq(schema.invoice.id, invoiceId))
      .for("update");

    if (!inv) return;

    // If amount is not provided, assume full payment of the remaining balance
    const currentPaid = inv.paidAmount || 0;
    const payAmount = amount !== undefined ? amount : (inv.amount - currentPaid);
    const newPaidAmount = currentPaid + payAmount;
    
    let status: "Paid" | "Unpaid" | "Partially Paid" = "Partially Paid";
    if (newPaidAmount >= inv.amount) {
      status = "Paid";
    } else if (newPaidAmount <= 0) {
      status = "Unpaid";
    }

    await tx
      .update(schema.invoice)
      .set({ 
        status: status,
        paidAmount: newPaidAmount
      })
      .where(eq(schema.invoice.id, invoiceId));

    const paymentLogId = `p-${Date.now()}`;
    await tx.insert(schema.paymentLog).values({
      id: paymentLogId,
      invoiceId,
      amount: payAmount,
      paymentMethod,
      transactionReference: reference || null,
      date: new Date().toISOString().split("T")[0],
    });

    // Create a CREDIT ledger entry
    const ledgerId = `le_${Date.now()}`;
    await tx.insert(schema.ledgerEntry).values({
      id: ledgerId,
      invoiceId,
      amount: payAmount,
      entryType: "CREDIT",
      reference: reference || `Manual Payment (${paymentMethod})`,
      createdAt: new Date(),
    });

    // Queue outbox event to send confirmation receipt email asynchronously
    const outboxId = `outbox_${Date.now()}`;
    await tx.insert(schema.outboxEvent).values({
      id: outboxId,
      aggregateType: "payment",
      aggregateId: invoiceId,
      eventType: "payment.succeeded",
      payload: JSON.stringify({
        invoiceId,
        amountPaid: payAmount,
        receiptNumber: reference || "CASH/CHEQUE",
        attemptId: paymentLogId,
      }),
      status: "PENDING",
      attempts: 0,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(schema.auditLog).values({
      id: `l-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      role: "super-admin",
      action: `Payment recorded for ${invoiceId}: ${payAmount} (${paymentMethod})`,
    });
  });
}

export async function updateUserAction(id: string, name: string, email: string, role: "super-admin" | "admin" | "teacher" | "student" | "parent") {
  await db
    .update(schema.user)
    .set({ name, email, role, updatedAt: new Date() })
    .where(eq(schema.user.id, id));

  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Systemaccount aktualisiert: ${name} (${email}, Rolle: ${role})`,
  });
}

export async function deleteUserAction(id: string) {
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, id))
    .limit(1);

  if (existingUser.length === 0) return;
  const u = existingUser[0];

  await db.delete(schema.user).where(eq(schema.user.id, id));

  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Systemaccount gelöscht: ${u.name} (${u.email}, Rolle: ${u.role})`,
  });
}
