"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable,healthInsurancePlansTable } from "@/db/schema";
import { logAuditActivity } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const deleteHealthInsurancePlanSchema = z.object({
  id: z.string().uuid({ message: "ID do plano inválido" }),
});

export const deleteHealthInsurancePlan = actionClient
  .schema(deleteHealthInsurancePlanSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem deletar planos de saúde");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    try {
      console.log(`🗑️ Deletando plano de saúde: ${parsedInput.id}`);

      // Buscar plano existente para auditoria
      const existingPlan = await db.query.healthInsurancePlansTable.findFirst({
        where: eq(healthInsurancePlansTable.id, parsedInput.id),
      });

      if (!existingPlan) {
        throw new Error("Plano de saúde não encontrado");
      }

      // Verificar se o plano pertence à clínica do usuário
      if (existingPlan.clinicId !== session.user.clinic.id) {
        throw new Error("Plano de saúde não encontrado");
      }

      // Verificar se há agendamentos associados
      const associatedAppointments = await db.query.appointmentsTable.findMany({
        where: eq(appointmentsTable.healthInsurancePlanId, parsedInput.id),
      });

      if (associatedAppointments.length > 0) {
        throw new Error(
          "Não é possível deletar este plano pois há agendamentos associados a ele. Desative o plano se necessário.",
        );
      }

      // Deletar plano
      await db
        .delete(healthInsurancePlansTable)
        .where(eq(healthInsurancePlansTable.id, parsedInput.id));

      // Log de auditoria LGPD
      await logAuditActivity({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        action: `Deletar plano de saúde: ${existingPlan.name}`,
        type: "data_deletion",
        details: {
          planId: parsedInput.id,
          planName: existingPlan.name,
        },
        success: true,
      });

      console.log(`✅ Plano de saúde deletado: ${parsedInput.id}`);

      revalidatePath("/configurations");

      return {
        success: true,
        message: "Plano de saúde deletado com sucesso!",
      };
    } catch (error) {
      console.error("❌ Erro ao deletar plano de saúde:", error);

      // Log de auditoria LGPD para erro
      await logAuditActivity({
        type: "data_access",
        action: "erro ao deletar plano de saúde",
        details: {
          planId: parsedInput.id,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
        userId: session.user.id,
        clinicId: session.user.clinic?.id,
        success: false,
      });

      if (error instanceof Error) {
        throw new Error(`Falha ao deletar plano de saúde: ${error.message}`);
      }

      throw new Error("Falha ao deletar plano de saúde: Erro desconhecido");
    }
  });
