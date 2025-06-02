CREATE TYPE "public"."security_log_type" AS ENUM('login', 'logout', 'failed_login', 'password_change', 'user_created', 'user_deleted', 'user_updated', 'permission_change', 'data_access', 'data_export', 'system_access', 'configuration_change');--> statement-breakpoint
CREATE TABLE "security_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"enable_login_logging" boolean DEFAULT true NOT NULL,
	"enable_data_access_logging" boolean DEFAULT true NOT NULL,
	"enable_configuration_logging" boolean DEFAULT true NOT NULL,
	"log_retention_days" integer DEFAULT 90 NOT NULL,
	"session_timeout_minutes" integer DEFAULT 480 NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 5 NOT NULL,
	"require_password_change" boolean DEFAULT false NOT NULL,
	"password_change_interval_days" integer DEFAULT 90,
	"notify_failed_logins" boolean DEFAULT true NOT NULL,
	"notify_new_logins" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "security_configurations_clinic_id_unique" UNIQUE("clinic_id")
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"user_id" text,
	"type" "security_log_type" NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"success" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_configurations" ADD CONSTRAINT "security_configurations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;