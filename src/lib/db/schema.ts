import { pgTable, text, integer, numeric, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";

// ==========================================
// 1. BETTER-AUTH ENGINE CORE TABLES
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // Custom roles for school authorization mapping
  role: text("role").$type<"super-admin" | "admin" | "teacher" | "student" | "parent">().notNull().default("student"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  scope: text("scope"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// ==========================================
// 2. PORTAL CORE BUSINESS MODELS
// ==========================================

export const studentProfile = pgTable("student_profile", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id").references(() => classroom.id, { onDelete: "set null" }),
  parentEmail: text("parent_email"),
});

export const teacherProfile = pgTable("teacher_profile", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").references(() => subject.id, { onDelete: "set null" }),
});

export const classroom = pgTable("classroom", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: text("teacher_id").references(() => user.id, { onDelete: "set null" }),
});

export const subject = pgTable("subject", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

// Many-to-Many junction table for Classrooms and Subjects
export const classroomSubject = pgTable("classroom_subject", {
  classroomId: text("classroom_id").notNull().references(() => classroom.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subject.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.classroomId, table.subjectId] }),
]);

export const grade = pgTable("grade", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id").notNull().references(() => classroom.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subject.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  gradedBy: text("graded_by").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
});

export const attendanceRecord = pgTable("attendance_record", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id").notNull().references(() => classroom.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  status: text("status").$type<"Present" | "Absent" | "Late">().notNull(),
});

export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().$type<number>(),
  description: text("description").notNull(),
  dueDate: text("due_date").notNull(), // Format: YYYY-MM-DD
  status: text("status").$type<"Paid" | "Unpaid">().notNull(),
  createdAt: text("created_at").notNull(), // Format: YYYY-MM-DD
});

export const paymentLog = pgTable("payment_log", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().$type<number>(),
  paymentMethod: text("payment_method").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(), // ISOString format
  actor: text("actor").notNull(),
  role: text("role").$type<"super-admin" | "admin" | "teacher" | "student" | "parent">().notNull(),
  action: text("action").notNull(),
});
