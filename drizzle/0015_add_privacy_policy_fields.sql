-- Migration para adicionar campos de LGPD na tabela users
ALTER TABLE "users" ADD COLUMN "privacy_policy_accepted" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "privacy_policy_accepted_at" timestamp;
ALTER TABLE "users" ADD COLUMN "privacy_policy_version" varchar(10) DEFAULT '1.0';

-- Atualizar usuários existentes para aceitar a política atual
UPDATE "users" SET 
  "privacy_policy_accepted" = true,
  "privacy_policy_accepted_at" = NOW(),
  "privacy_policy_version" = '1.0'
WHERE "privacy_policy_accepted" = false; 