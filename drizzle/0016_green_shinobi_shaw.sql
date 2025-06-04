ALTER TYPE "public"."security_log_type" ADD VALUE 'data_import' BEFORE 'system_access';--> statement-breakpoint
ALTER TYPE "public"."security_log_type" ADD VALUE 'data_creation' BEFORE 'system_access';--> statement-breakpoint
ALTER TYPE "public"."security_log_type" ADD VALUE 'data_update' BEFORE 'system_access';--> statement-breakpoint
ALTER TYPE "public"."security_log_type" ADD VALUE 'data_deletion' BEFORE 'system_access';--> statement-breakpoint
CREATE TABLE "daily_revenue_view" (
	"date" timestamp NOT NULL,
	"clinic_id" uuid NOT NULL,
	"total_amount_in_cents" integer NOT NULL,
	"total_transactions" integer NOT NULL,
	"average_transaction_in_cents" integer
);
--> statement-breakpoint
CREATE TABLE "doctor_revenue_view" (
	"doctor_id" uuid NOT NULL,
	"doctor_name" text NOT NULL,
	"specialty" text NOT NULL,
	"clinic_id" uuid NOT NULL,
	"total_amount_in_cents" integer NOT NULL,
	"total_appointments" integer NOT NULL,
	"average_appointment_value_in_cents" integer,
	"last_appointment_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "monthly_revenue_view" (
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"clinic_id" uuid NOT NULL,
	"total_amount_in_cents" integer NOT NULL,
	"total_transactions" integer NOT NULL,
	"total_doctors" integer,
	"total_patients" integer
);
--> statement-breakpoint
CREATE TABLE "payment_method_revenue_view" (
	"date" timestamp NOT NULL,
	"clinic_id" uuid NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"total_amount_in_cents" integer NOT NULL,
	"transaction_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smtp_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"secure" boolean DEFAULT false NOT NULL,
	"user" text NOT NULL,
	"password" text NOT NULL,
	"from_email" text NOT NULL,
	"from_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp,
	"last_test_result" boolean DEFAULT false,
	"test_error_message" text,
	"daily_limit" integer DEFAULT 500,
	"emails_sent_today" integer DEFAULT 0,
	"last_reset_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "smtp_configurations_clinic_id_unique" UNIQUE("clinic_id")
);
--> statement-breakpoint
ALTER TABLE "smtp_configurations" ADD CONSTRAINT "smtp_configurations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;