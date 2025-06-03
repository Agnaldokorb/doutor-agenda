CREATE TABLE "health_insurance_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"reimbursement_value_in_cents" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "health_insurance_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "appointment_price_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_policy_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_policy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_policy_version" text DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "health_insurance_plans" ADD CONSTRAINT "health_insurance_plans_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_health_insurance_plan_id_health_insurance_plans_id_fk" FOREIGN KEY ("health_insurance_plan_id") REFERENCES "public"."health_insurance_plans"("id") ON DELETE set null ON UPDATE no action;