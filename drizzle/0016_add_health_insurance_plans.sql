-- Migration para adicionar sistema de planos de saúde
-- Criar tabela de planos de saúde
CREATE TABLE "health_insurance_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "reimbursement_value_in_cents" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Adicionar índices para performance
CREATE INDEX "health_insurance_plans_clinic_id_idx" ON "health_insurance_plans"("clinic_id");
CREATE INDEX "health_insurance_plans_active_idx" ON "health_insurance_plans"("is_active");

-- Adicionar campo de plano de saúde na tabela de agendamentos
ALTER TABLE "appointments" ADD COLUMN "health_insurance_plan_id" uuid REFERENCES "health_insurance_plans"("id") ON DELETE SET NULL;

-- Criar índice para o novo campo
CREATE INDEX "appointments_health_insurance_plan_id_idx" ON "appointments"("health_insurance_plan_id");

-- Comentários para documentação
COMMENT ON TABLE "health_insurance_plans" IS 'Planos de saúde configurados por clínica';
COMMENT ON COLUMN "health_insurance_plans"."reimbursement_value_in_cents" IS 'Valor de reembolso do plano em centavos';
COMMENT ON COLUMN "appointments"."health_insurance_plan_id" IS 'Plano de saúde associado ao agendamento (opcional)'; 