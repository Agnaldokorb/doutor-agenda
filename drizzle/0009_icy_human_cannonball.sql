ALTER TABLE "clinics" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "cnpj" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "business_hours" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "appointment_duration_minutes" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "allow_online_booking" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "require_email_confirmation" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "auto_confirm_appointments" boolean DEFAULT false;