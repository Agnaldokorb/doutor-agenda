"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db";

export const checkEmailStatus = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  console.log("🔍 Verificando configuração de email da clínica...");

  try {
    // Verificar se Resend está configurado
    const resendConfigured = !!process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const resendFromName = process.env.RESEND_FROM_NAME;

    // Buscar a clínica do usuário
    const userClinic = await db.query.usersToClinicsTable.findFirst({
      where: (table, { eq }) => eq(table.userId, session.user.id),
      with: {
        clinic: true,
      },
    });

    if (!userClinic?.clinic) {
      throw new Error("Clínica não encontrada");
    }

    const clinicId = userClinic.clinic.id;

    // Se Resend está configurado, usar como principal
    if (resendConfigured) {
      // Testar conexão Resend
      const connectionTest = await emailService.testConnection();

      return {
        emailService: connectionTest,
        reminderService: connectionTest,
        message: connectionTest
          ? "Resend configurado e funcionando"
          : "Resend configurado mas com problemas",
        details: {
          provider: "Resend",
          hasConfiguration: true,
          resendConfigured: true,
          connectionTest,
          // Informações do Resend
          fromEmail: resendFromEmail || "não configurado",
          fromName: resendFromName || "Doutor Agenda",
          clinicId,
          clinicName: userClinic.clinic.name,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Se Resend não está configurado
    return {
      emailService: false,
      reminderService: false,
      message: "Nenhuma configuração de email encontrada",
      details: {
        provider: "Não configurado",
        hasConfiguration: false,
        resendConfigured: false,
        clinicId,
        clinicName: userClinic.clinic.name,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao verificar status do email:", error);

    return {
      emailService: false,
      reminderService: false,
      message: "Erro ao verificar configuração de email",
      details: {
        provider: "Erro",
        resendConfigured: !!process.env.RESEND_API_KEY,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
    };
  }
});
