"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { healthInsurancePlansTable } from "@/db/schema";
import { logAuditActivity } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const upsertHealthInsurancePlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome do plano é obrigatório" }),
  reimbursementValueInCents: z.number().min(0, {
    message: "Valor de reembolso deve ser maior ou igual a zero",
  }),
  isActive: z.boolean().default(true),
});

export const upsertHealthInsurancePlan = actionClient
  .schema(upsertHealthInsurancePlanSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem gerenciar planos de saúde");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    try {
      const isUpdate = !!parsedInput.id;

      console.log(
        `💳 ${isUpdate ? "Atualizando" : "Criando"} plano de saúde: ${parsedInput.name}`,
      );

      let planId = parsedInput.id;

      if (isUpdate) {
        // Buscar plano existente para auditoria
        const existingPlan = await db.query.healthInsurancePlansTable.findFirst(
          {
            where: eq(healthInsurancePlansTable.id, parsedInput.id!),
          },
        );

        if (!existingPlan) {
          throw new Error("Plano de saúde não encontrado");
        }

        // Verificar se o plano pertence à clínica do usuário
        if (existingPlan.clinicId !== session.user.clinic.id) {
          throw new Error("Plano de saúde não encontrado");
        }

        // Atualizar plano existente
        await db
          .update(healthInsurancePlansTable)
          .set({
            name: parsedInput.name,
            reimbursementValueInCents: parsedInput.reimbursementValueInCents,
            isActive: parsedInput.isActive,
          })
          .where(eq(healthInsurancePlansTable.id, parsedInput.id!));

        // Log de auditoria LGPD
        await logAuditActivity({
          type: "data_update",
          action: "atualizar plano de saúde",
          details: {
            planId: parsedInput.id,
            planName: parsedInput.name,
            before: {
              name: existingPlan.name,
              reimbursementValueInCents: existingPlan.reimbursementValueInCents,
              isActive: existingPlan.isActive,
            },
            after: {
              name: parsedInput.name,
              reimbursementValueInCents: parsedInput.reimbursementValueInCents,
              isActive: parsedInput.isActive,
            },
          },
          userId: session.user.id,
          clinicId: session.user.clinic.id,
        });

        console.log(`✅ Plano de saúde atualizado: ${parsedInput.id}`);
      } else {
        // Criar novo plano
        const result = await db
          .insert(healthInsurancePlansTable)
          .values({
            clinicId: session.user.clinic.id,
            name: parsedInput.name,
            reimbursementValueInCents: parsedInput.reimbursementValueInCents,
            isActive: parsedInput.isActive,
          })
          .returning();

        planId = result[0].id;

        // Log de auditoria LGPD
        await logAuditActivity({
          type: "data_creation",
          action: "criar plano de saúde",
          details: {
            planId,
            planName: parsedInput.name,
            reimbursementValueInCents: parsedInput.reimbursementValueInCents,
            isActive: parsedInput.isActive,
          },
          userId: session.user.id,
          clinicId: session.user.clinic.id,
        });

        console.log(`✅ Plano de saúde criado: ${planId}`);
      }

      revalidatePath("/configurations");

      return {
        success: true,
        planId,
        message: `Plano de saúde ${isUpdate ? "atualizado" : "criado"} com sucesso!`,
      };
    } catch (error) {
      console.error("❌ Erro ao processar plano de saúde:", error);

      // Log de auditoria LGPD para erro
      await logAuditActivity({
        type: "data_access",
        action: `erro ao ${parsedInput.id ? "atualizar" : "criar"} plano de saúde`,
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          planName: parsedInput.name,
        },
        userId: session.user.id,
        clinicId: session.user.clinic?.id,
        success: false,
      });

      if (error instanceof Error) {
        throw new Error(`Falha ao processar plano de saúde: ${error.message}`);
      }

      throw new Error("Falha ao processar plano de saúde: Erro desconhecido");
    }
  });
