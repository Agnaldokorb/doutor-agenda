"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { securityConfigurationsTable, securityLogsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { updateSecurityConfigurationSchema } from "./schema";

export const updateSecurityConfiguration = actionClient
  .schema(updateSecurityConfigurationSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    console.log(
      `🔧 Atualizando configurações de segurança da clínica: ${session.user.clinic.id}`,
    );

    try {
      // Atualizar configurações de segurança
      const [updatedConfiguration] = await db
        .update(securityConfigurationsTable)
        .set({
          ...parsedInput,
          updatedAt: new Date(),
        })
        .where(eq(securityConfigurationsTable.clinicId, session.user.clinic.id))
        .returning();

      // Registrar log de alteração de configuração
      await db.insert(securityLogsTable).values({
        clinicId: session.user.clinic.id,
        userId: session.user.id,
        type: "configuration_change",
        action: "Configurações de segurança atualizadas",
        details: JSON.stringify({
          changedFields: Object.keys(parsedInput),
          timestamp: new Date().toISOString(),
        }),
        success: true,
      });

      console.log("✅ Configurações de segurança atualizadas com sucesso");

      return {
        success: true,
        configuration: updatedConfiguration,
      };
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações de segurança:", error);

      // Registrar log de erro
      await db.insert(securityLogsTable).values({
        clinicId: session.user.clinic.id,
        userId: session.user.id,
        type: "configuration_change",
        action: "Falha ao atualizar configurações de segurança",
        details: JSON.stringify({
          error: error instanceof Error ? error.message : "Erro desconhecido",
          timestamp: new Date().toISOString(),
        }),
        success: false,
      });

      throw new Error(
        `Falha ao atualizar configurações de segurança: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
