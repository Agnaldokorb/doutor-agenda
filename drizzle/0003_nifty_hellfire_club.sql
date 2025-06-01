ALTER TABLE "doctors" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;