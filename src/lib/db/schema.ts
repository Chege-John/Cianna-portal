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
  mustChangePassword: boolean("must_change_password").notNull().default(false),
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
  firstName: text("first_name"),
  lastName: text("last_name"),
  dob: text("dob"),
  nationality: text("nationality"),
  idNumber: text("id_number"),
  profession: text("profession"),
  courseLevel: text("course_level").$type<"A1" | "A2" | "B1" | "B2">(),
  schedule: text("schedule").$type<"Online" | "Physical" | "Hybrid">(),
  phoneNumber: text("phone_number"),
  guardianName: text("guardian_name"),
  guardianRelationship: text("guardian_relationship"),
  guardianPhone: text("guardian_phone"),
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
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0.00").$type<number>(),
  description: text("description").notNull(),
  dueDate: text("due_date").notNull(), // Format: YYYY-MM-DD
  status: text("status").$type<"Paid" | "Unpaid" | "Partially Paid">().notNull(),
  createdAt: text("created_at").notNull(), // Format: YYYY-MM-DD
});

export const paymentLog = pgTable("payment_log", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().$type<number>(),
  paymentMethod: text("payment_method").notNull(), // Mpesa, Cash, Cheque
  transactionReference: text("transaction_reference"), // Mpesa code, Cheque No, etc.
  date: text("date").notNull(), // Format: YYYY-MM-DD
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(), // ISOString format
  actor: text("actor").notNull(),
  role: text("role").$type<"super-admin" | "admin" | "teacher" | "student" | "parent">().notNull(),
  action: text("action").notNull(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountReference: text("account_reference").notNull(),
  callbackUrl: text("callback_url").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// ==========================================
// 3. ENTERPRISE PAYMENT ORCHESTRATION SCHEMAS
// ==========================================

export const paymentSession = pgTable("payment_session", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().$type<number>(),
  currency: text("currency").notNull().default("KES"),
  status: text("status").$type<"CREATED" | "ACTIVE" | "SUCCEEDED" | "FAILED" | "EXPIRED">().notNull().default("CREATED"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentAttempt = pgTable("payment_attempt", {
  id: text("id").primaryKey(),
  paymentSessionId: text("payment_session_id").notNull().references(() => paymentSession.id, { onDelete: "restrict" }),
  providerId: text("provider_id").notNull(), // e.g., 'SERIX_MPESA'
  paymentMethod: text("payment_method").notNull(), // 'STK_PUSH'
  phoneNumber: text("phone_number"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().$type<number>(),
  status: text("status").$type<"INITIATED" | "PENDING_CALLBACK" | "SUCCESS" | "FAILED" | "REJECTED" | "TIMEOUT">().notNull().default("INITIATED"),
  providerReference: text("provider_reference").unique(), // MerchantRequestID or CheckoutRequestID
  providerReceipt: text("provider_receipt").unique(), // MpesaReceiptNumber
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ledgerEntry = pgTable("ledger_entry", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoice.id, { onDelete: "restrict" }),
  paymentAttemptId: text("payment_attempt_id").references(() => paymentAttempt.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().$type<number>(),
  entryType: text("entry_type").$type<"DEBIT" | "CREDIT">().notNull(),
  reference: text("reference"), // M-PESA Code or adjustment reason
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentEvent = pgTable("payment_event", {
  id: text("id").primaryKey(),
  paymentSessionId: text("payment_session_id").notNull().references(() => paymentSession.id, { onDelete: "cascade" }),
  paymentAttemptId: text("payment_attempt_id").references(() => paymentAttempt.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // PaymentSessionCreated, STKPushSent, CallbackReceived, etc.
  payload: text("payload"), // Stringified JSON or telemetry details
  correlationId: text("correlation_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const outboxEvent = pgTable("outbox_event", {
  id: text("id").primaryKey(),
  aggregateType: text("aggregate_type").notNull(), // 'payment'
  aggregateId: text("aggregate_id").notNull(), // invoiceId
  eventType: text("event_type").notNull(), // 'payment.succeeded', etc.
  payload: text("payload").notNull(), // Stringified payload
  status: text("status").$type<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED">().notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
