ALTER TABLE "doctors" DROP CONSTRAINT "doctors_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "doctors" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;