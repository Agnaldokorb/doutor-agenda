"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { actionClient } from "@/lib/next-safe-action";

export const checkEmailStatus = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  console.log("🔍 Verificando status real do serviço de email...");

  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const hasApiKey = !!process.env.SENDGRID_API_KEY;
    const hasFromEmail = !!process.env.SENDGRID_FROM_EMAIL;

    if (!hasApiKey || !hasFromEmail) {
      return {
        emailService: false,
        reminderService: false,
        message: "Configurações de email não encontradas",
        details: {
          hasApiKey,
          hasFromEmail,
          fromEmail: process.env.SENDGRID_FROM_EMAIL || "",
        },
      };
    }

    // Testar conexão real com SendGrid
    const connectionTest = await emailService.testConnection();

    console.log(
      connectionTest
        ? "✅ Serviço de email funcionando"
        : "❌ Serviço de email com falha",
    );

    return {
      emailService: connectionTest,
      reminderService: connectionTest, // Lembretes dependem do mesmo serviço
      message: connectionTest
        ? "Serviços de email funcionando corretamente"
        : "Falha na conexão com o serviço de email",
      details: {
        hasApiKey: true,
        hasFromEmail: true,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || "",
        connectionTest,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao verificar status do email:", error);

    return {
      emailService: false,
      reminderService: false,
      message: "Erro ao verificar status do serviço",
      details: {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
    };
  }
});
