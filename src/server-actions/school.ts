"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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

export async function addStudentAction(name: string, email: string, classroomId: string, parentEmail?: string) {
  const studentId = `u-${Date.now()}`;
  await db.insert(schema.user).values({
    id: studentId,
    name,
    email,
    role: "student",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(schema.studentProfile).values({
    id: studentId,
    classroomId,
    parentEmail: parentEmail || null,
  });
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Schüler registriert: ${name} (${email})`,
  });
  return studentId;
}

export async function addTeacherAction(name: string, email: string, subjectId: string) {
  const teacherId = `u-${Date.now()}`;
  await db.insert(schema.user).values({
    id: teacherId,
    name,
    email,
    role: "teacher",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(schema.teacherProfile).values({
    id: teacherId,
    subjectId,
  });
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Lehrkraft registriert: ${name} (${email})`,
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
  await db.insert(schema.invoice).values({
    id: invoiceId,
    studentId,
    amount,
    description,
    dueDate,
    status: "Unpaid",
    createdAt: new Date().toISOString().split("T")[0],
  });
  await db.insert(schema.auditLog).values({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "System",
    role: "super-admin",
    action: `Rechnung erstellt: ${amount} EUR - ${description}`,
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

export async function payInvoiceAction(invoiceId: string, paymentMethod: string) {
  const invoice = await db
    .select()
    .from(schema.invoice)
    .where(eq(schema.invoice.id, invoiceId))
    .limit(1);

  if (invoice.length === 0) return;

  const inv = invoice[0];

  await db
    .update(schema.invoice)
    .set({ status: "Paid" })
    .where(eq(schema.invoice.id, invoiceId));

  await db.insert(schema.paymentLog).values({
    id: `p-${Date.now()}`,
    invoiceId,
    amount: inv.amount,
    paymentMethod,
    date: new Date().toISOString().split("T")[0],
  });
}
