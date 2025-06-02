"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { securityConfigurationsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getSecurityConfiguration = actionClient.action(async () => {
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
    `🔍 Buscando configurações de segurança da clínica: ${session.user.clinic.id}`,
  );

  try {
    // Buscar configurações de segurança da clínica
    let configuration = await db.query.securityConfigurationsTable.findFirst({
      where: eq(securityConfigurationsTable.clinicId, session.user.clinic.id),
    });

    // Se não existir configuração, criar uma com valores padrão
    if (!configuration) {
      console.log("📝 Criando configuração de segurança padrão para a clínica");

      const [newConfiguration] = await db
        .insert(securityConfigurationsTable)
        .values({
          clinicId: session.user.clinic.id,
          enableLoginLogging: true,
          enableDataAccessLogging: true,
          enableConfigurationLogging: true,
          logRetentionDays: 90,
          sessionTimeoutMinutes: 480,
          maxConcurrentSessions: 5,
          requirePasswordChange: false,
          passwordChangeIntervalDays: 90,
          notifyFailedLogins: true,
          notifyNewLogins: false,
        })
        .returning();

      configuration = newConfiguration;
    }

    console.log("✅ Configurações de segurança carregadas");

    return {
      success: true,
      configuration,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar configurações de segurança:", error);
    throw new Error(
      `Falha ao buscar configurações de segurança: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});
