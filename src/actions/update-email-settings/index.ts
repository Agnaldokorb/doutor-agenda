"use server";


import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { actionClient } from "@/lib/next-safe-action";

const emailSettingsSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória"),
  fromEmail: z.string().email("Email de origem inválido"),
  fromName: z.string().min(1, "Nome de origem é obrigatório"),
});

export const updateEmailSettings = actionClient
  .schema(emailSettingsSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem alterar configurações");
    }

    console.log("🔧 Validando configurações de email...");

    // Salvar as configurações originais
    const originalApiKey = process.env.SENDGRID_API_KEY;
    const originalFromEmail = process.env.SENDGRID_FROM_EMAIL;
    const originalFromName = process.env.SENDGRID_FROM_NAME;

    try {
      // Temporariamente definir as novas configurações para teste
      process.env.SENDGRID_API_KEY = parsedInput.apiKey;
      process.env.SENDGRID_FROM_EMAIL = parsedInput.fromEmail;
      process.env.SENDGRID_FROM_NAME = parsedInput.fromName;

      // Reconfigurar o SendGrid com a nova API key
      const { sgMail } = await import("@/lib/sendgrid");
      sgMail.setApiKey(parsedInput.apiKey);

      // Testar a conexão
      console.log("🧪 Testando conexão com SendGrid...");
      const testSuccess = await emailService.testConnection();

      if (!testSuccess) {
        throw new Error("Falha ao conectar com SendGrid. Verifique a API Key.");
      }

      console.log("✅ Configurações de email validadas com sucesso!");

      // Em um ambiente real, você salvaria essas configurações em um banco de dados
      // Por agora, retornamos sucesso indicando que as configurações foram validadas

      return {
        message:
          "Configurações de email validadas com sucesso! Configure as variáveis de ambiente no servidor.",
        testSuccess: true,
        settings: {
          apiKeyValid: true,
          fromEmail: parsedInput.fromEmail,
          fromName: parsedInput.fromName,
        },
      };
    } catch (error) {
      console.error("❌ Erro ao validar configurações de email:", error);

      throw new Error(
        error instanceof Error
          ? `Erro na configuração: ${error.message}`
          : "Erro desconhecido ao validar configurações",
      );
    } finally {
      // Restaurar configurações originais
      if (originalApiKey) {
        process.env.SENDGRID_API_KEY = originalApiKey;
      } else {
        delete process.env.SENDGRID_API_KEY;
      }

      if (originalFromEmail) {
        process.env.SENDGRID_FROM_EMAIL = originalFromEmail;
      } else {
        delete process.env.SENDGRID_FROM_EMAIL;
      }

      if (originalFromName) {
        process.env.SENDGRID_FROM_NAME = originalFromName;
      } else {
        delete process.env.SENDGRID_FROM_NAME;
      }

      // Reconfigurar o SendGrid com a API key original (se existir)
      if (originalApiKey) {
        const { sgMail } = await import("@/lib/sendgrid");
        sgMail.setApiKey(originalApiKey);
      }
    }
  });

export const testEmailConfiguration = actionClient
  .schema(
    z.object({
      type: z.enum([
        "connection",
        "confirmation",
        "reminder",
        "cancellation",
        "update",
      ]),
      testEmail: z.string().email("Email para teste inválido"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem testar configurações");
    }

    console.log(
      `🧪 Testando email tipo '${parsedInput.type}' para: ${parsedInput.testEmail}`,
    );

    try {
      if (parsedInput.type === "connection") {
        const success = await emailService.testConnection();
        if (!success) {
          throw new Error("Falha no teste de conexão");
        }
        return {
          message: "Teste de conexão realizado com sucesso!",
          success: true,
        };
      }

      // Dados de teste para templates
      const testData = {
        patientName: session.user.name || "Paciente Teste",
        doctorName: "Dr. João Silva",
        doctorSpecialty: "Cardiologia",
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
        patientEmail: parsedInput.testEmail,
        price: 15000, // R$ 150,00
        confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
      };

      let success = false;

      switch (parsedInput.type) {
        case "confirmation":
          success = await emailService.sendAppointmentConfirmation(testData);
          break;
        case "reminder":
          success = await emailService.sendAppointmentReminder(testData);
          break;
        case "cancellation":
          success = await emailService.sendAppointmentCancellation(testData);
          break;
        case "update":
          success = await emailService.sendAppointmentUpdate(testData);
          break;
        default:
          throw new Error(`Tipo de email não suportado: ${parsedInput.type}`);
      }

      if (!success) {
        throw new Error(
          `Falha ao enviar email de teste tipo '${parsedInput.type}'`,
        );
      }

      return {
        message: `Email de teste '${parsedInput.type}' enviado com sucesso para ${parsedInput.testEmail}!`,
        success: true,
        type: parsedInput.type,
        testEmail: parsedInput.testEmail,
      };
    } catch (error) {
      console.error("❌ Erro no teste de email:", error);
      throw new Error(
        error instanceof Error
          ? `Erro no teste: ${error.message}`
          : "Erro desconhecido no teste de email",
      );
    }
  });
