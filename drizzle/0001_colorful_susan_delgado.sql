CREATE TABLE "ledger_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"payment_attempt_id" text,
	"amount" numeric(12, 2) NOT NULL,
	"entry_type" text NOT NULL,
	"reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_event" (
	"id" text PRIMARY KEY NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_session_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"payment_method" text NOT NULL,
	"phone_number" text,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'INITIATED' NOT NULL,
	"provider_reference" text,
	"provider_receipt" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_attempt_provider_reference_unique" UNIQUE("provider_reference"),
	CONSTRAINT "payment_attempt_provider_receipt_unique" UNIQUE("provider_receipt")
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_session_id" text NOT NULL,
	"payment_attempt_id" text,
	"event_type" text NOT NULL,
	"payload" text,
	"correlation_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_session" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"status" text DEFAULT 'CREATED' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_session_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "payment_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_name" text NOT NULL,
	"account_reference" text NOT NULL,
	"callback_url" text NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "paid_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_log" ADD COLUMN "transaction_reference" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "dob" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "id_number" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "profession" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "course_level" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "schedule" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "guardian_name" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "guardian_relationship" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "guardian_phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_payment_attempt_id_payment_attempt_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempt"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempt" ADD CONSTRAINT "payment_attempt_payment_session_id_payment_session_id_fk" FOREIGN KEY ("payment_session_id") REFERENCES "public"."payment_session"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_session_id_payment_session_id_fk" FOREIGN KEY ("payment_session_id") REFERENCES "public"."payment_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_attempt_id_payment_attempt_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_session" ADD CONSTRAINT "payment_session_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;