CREATE TYPE "public"."payment_method" AS ENUM('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'cheque', 'transferencia_eletronica');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pendente', 'pago', 'parcial', 'cancelado');--> statement-breakpoint
CREATE TABLE "appointment_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"total_amount_in_cents" integer NOT NULL,
	"paid_amount_in_cents" integer DEFAULT 0 NOT NULL,
	"remaining_amount_in_cents" integer NOT NULL,
	"change_amount_in_cents" integer DEFAULT 0 NOT NULL,
	"status" "payment_status" DEFAULT 'pendente' NOT NULL,
	"processed_by_user_id" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_payment_id" uuid NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"transaction_reference" text,
	"card_last_four_digits" text,
	"card_flag" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_processed_by_user_id_users_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_appointment_payment_id_appointment_payments_id_fk" FOREIGN KEY ("appointment_payment_id") REFERENCES "public"."appointment_payments"("id") ON DELETE cascade ON UPDATE no action;