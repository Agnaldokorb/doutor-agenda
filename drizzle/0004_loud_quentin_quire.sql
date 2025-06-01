CREATE TYPE "public"."user_type" AS ENUM('admin', 'doctor');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type" "user_type" DEFAULT 'admin' NOT NULL;