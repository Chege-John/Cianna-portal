import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashPassword } from "@better-auth/utils/password";
import * as schema from "../src/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is missing. Cannot seed database.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

// ==========================================
// SAMPLE DATASETS MAPPED FROM SCHOOLCONTEXT
// ==========================================

const initialUsers = [
  { id: "u-1", name: "Herr Müller", email: "mueller@cianna.de", role: "super-admin" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-2", name: "Frau Schmidt", email: "schmidt@cianna.de", role: "admin" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-3", name: "Herr Weber (Deutsch-A1)", email: "weber@cianna.de", role: "teacher" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-4", name: "Frau Wagner (Deutsch-B2)", email: "wagner@cianna.de", role: "teacher" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-5", name: "Lukas Meier", email: "lukas@student.de", role: "student" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-6", name: "Sofia Becker", email: "sofia@student.de", role: "student" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-7", name: "Maria Meier", email: "maria@parent.de", role: "parent" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "u-8", name: "John Irungu Chege", email: "johnirunguchege2000@gmail.com", role: "super-admin" as const, emailVerified: true, createdAt: new Date(), updatedAt: new Date() }
];

const initialSubjects = [
  { id: "s-1", name: "Grammatik & Wortschatz" },
  { id: "s-2", name: "Konversation & Aussprache" },
  { id: "s-3", name: "Schreiben & Hören" }
];

const initialClassrooms = [
  { id: "c-1", name: "Deutsch A1 - Intensiv", teacherId: "u-3" },
  { id: "c-2", name: "Deutsch B2 - Abendkurs", teacherId: "u-4" }
];

const classroomSubjects = [
  { classroomId: "c-1", subjectId: "s-1" },
  { classroomId: "c-1", subjectId: "s-3" },
  { classroomId: "c-2", subjectId: "s-1" },
  { classroomId: "c-2", subjectId: "s-2" },
  { classroomId: "c-2", subjectId: "s-3" }
];

const studentProfiles = [
  { id: "u-5", classroomId: "c-1", parentEmail: "maria@parent.de" },
  { id: "u-6", classroomId: "c-2", parentEmail: undefined }
];

const teacherProfiles = [
  { id: "u-3", subjectId: "s-1" },
  { id: "u-4", subjectId: "s-2" }
];

const initialGrades = [
  { id: "g-1", studentId: "u-5", classroomId: "c-1", subjectId: "s-1", score: 85, gradedBy: "Herr Weber", date: "2026-06-15" },
  { id: "g-2", studentId: "u-6", classroomId: "c-2", subjectId: "s-1", score: 92, gradedBy: "Frau Wagner", date: "2026-06-16" },
  { id: "g-3", studentId: "u-6", classroomId: "c-2", subjectId: "s-2", score: 95, gradedBy: "Frau Wagner", date: "2026-06-18" }
];

const initialAttendance = [
  { id: "a-1", studentId: "u-5", classroomId: "c-1", date: "2026-06-20", status: "Present" as const },
  { id: "a-2", studentId: "u-5", classroomId: "c-1", date: "2026-06-21", status: "Late" as const },
  { id: "a-3", studentId: "u-6", classroomId: "c-2", date: "2026-06-20", status: "Present" as const },
  { id: "a-4", studentId: "u-6", classroomId: "c-2", date: "2026-06-21", status: "Present" as const }
];

const initialInvoices = [
  { id: "inv-1", studentId: "u-5", amount: 350.00, description: "Kursgebühr A1 - Intensiv (Monat Juni)", dueDate: "2026-07-05", status: "Unpaid" as const, createdAt: "2026-06-15" },
  { id: "inv-2", studentId: "u-5", amount: 45.00, description: "Lehrmaterialien A1 (Schritte International)", dueDate: "2026-06-25", status: "Paid" as const, createdAt: "2026-06-10" },
  { id: "inv-3", studentId: "u-6", amount: 480.00, description: "Kursgebühr B2 - Abendkurs (Monat Juni)", dueDate: "2026-06-30", status: "Paid" as const, createdAt: "2026-06-10" }
];

const initialPayments = [
  { id: "p-1", invoiceId: "inv-2", amount: 45.00, paymentMethod: "Kreditkarte", date: "2026-06-12" },
  { id: "p-2", invoiceId: "inv-3", amount: 480.00, paymentMethod: "Banküberweisung", date: "2026-06-14" }
];

const initialAuditLogs = [
  { id: "l-1", timestamp: "2026-06-10T09:00:00Z", actor: "Herr Müller", role: "super-admin" as const, action: "Cianna Portal initialisiert." },
  { id: "l-2", timestamp: "2026-06-10T10:15:00Z", actor: "Frau Schmidt", role: "admin" as const, action: "Klassenräume Deutsch A1 und B2 eingerichtet." },
  { id: "l-3", timestamp: "2026-06-15T14:30:00Z", actor: "Herr Weber", role: "teacher" as const, action: "Noten für Lukas Meier in Grammatik eingetragen." }
];

async function main() {
  console.log("🌱 Starting seed database run...");

  try {
    // 1. Clean existing records in correct order to respect foreign key constraints
    console.log("🧹 Cleaning old records...");
    await db.delete(schema.auditLog);
    await db.delete(schema.paymentLog);
    await db.delete(schema.invoice);
    await db.delete(schema.attendanceRecord);
    await db.delete(schema.grade);
    await db.delete(schema.classroomSubject);
    await db.delete(schema.studentProfile);
    await db.delete(schema.teacherProfile);
    await db.delete(schema.classroom);
    await db.delete(schema.subject);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    await db.delete(schema.user);

    // 2. Insert Core Users & Accounts
    console.log("👤 Seeding Users...");
    await db.insert(schema.user).values(initialUsers);

    console.log("🔑 Seeding Better Auth Accounts...");
    const accounts = await Promise.all(
      initialUsers.map(async (user) => {
        const pwd = user.email === "johnirunguchege2000@gmail.com" ? "12345678" : "changeme";
        return {
          id: `acc-${user.id}`,
          accountId: user.email,
          providerId: "credential",
          userId: user.id,
          password: await hashPassword(pwd),
          createdAt: new Date(),
          updatedAt: new Date()
        };
      })
    );
    await db.insert(schema.account).values(accounts);

    // 3. Insert Subjects
    console.log("📚 Seeding Subjects...");
    await db.insert(schema.subject).values(initialSubjects);

    // 4. Insert Classrooms
    console.log("🏫 Seeding Classrooms...");
    await db.insert(schema.classroom).values(initialClassrooms);

    // 5. Insert Classroom-Subject junctions
    console.log("🔗 Seeding Classroom Subjects relationships...");
    await db.insert(schema.classroomSubject).values(classroomSubjects);

    // 6. Insert Profiles
    console.log("🏷️ Seeding Student Profiles...");
    await db.insert(schema.studentProfile).values(studentProfiles);

    console.log("👨‍🏫 Seeding Teacher Profiles...");
    await db.insert(schema.teacherProfile).values(teacherProfiles);

    // 7. Insert Grades
    console.log("📝 Seeding Grades...");
    await db.insert(schema.grade).values(initialGrades);

    // 8. Insert Attendance Records
    console.log("📅 Seeding Attendance records...");
    await db.insert(schema.attendanceRecord).values(initialAttendance);

    // 9. Insert Invoices & Payments
    console.log("💳 Seeding Invoices...");
    await db.insert(schema.invoice).values(initialInvoices);

    console.log("💸 Seeding Payments logs...");
    await db.insert(schema.paymentLog).values(initialPayments);

    // 10. Insert Audit Logs
    console.log("📋 Seeding Audit logs...");
    await db.insert(schema.auditLog).values(initialAuditLogs);

    console.log("✅ Seed database process completed successfully.");
  } catch (error) {
    console.error("❌ Seeding database failed with error:", error);
    process.exit(1);
  }
}

main();
