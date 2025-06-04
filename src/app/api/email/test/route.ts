import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service-resend";
import {
  createAppointmentCancellationTemplate,
  createAppointmentConfirmationTemplate,
  createAppointmentReminderTemplate,
  createAppointmentUpdateTemplate,
} from "@/lib/email-templates";

interface EmailTemplate {
  subject: string;
  html: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!session?.user.clinic?.id) {
      return NextResponse.json(
        { error: "Clínica não encontrada" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { type, email } = body;

    // Validar parâmetros
    if (!type || !email) {
      return NextResponse.json(
        { error: "Tipo de email e endereço são obrigatórios" },
        { status: 400 },
      );
    }

    // Validar se o email é válido
    if (!emailService.isValidEmail(email)) {
      return NextResponse.json(
        { error: "Endereço de email inválido" },
        { status: 400 },
      );
    }

    console.log(`🧪 Testando envio de email tipo '${type}' para: ${email}`);

    // Dados de teste
    const testData = {
      patientName: session.user.name || "Paciente Teste",
      doctorName: "Dr. João Silva",
      doctorSpecialty: "Cardiologia",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      patientEmail: email,
      price: 15000, // R$ 150,00
      confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
    };

    const clinicId = session.user.clinic.id;
    let success = false;
    let template: EmailTemplate | null = null;

    switch (type) {
      case "confirmation":
        template = createAppointmentConfirmationTemplate(testData);
        success = await emailService.sendAppointmentConfirmation(
          testData,
          clinicId,
        );
        break;

      case "reminder":
        template = createAppointmentReminderTemplate(testData);
        success = await emailService.sendAppointmentReminder(
          testData,
          clinicId,
        );
        break;

      case "cancellation":
        template = createAppointmentCancellationTemplate(testData);
        success = await emailService.sendAppointmentCancellation(
          testData,
          clinicId,
        );
        break;

      case "update":
        template = createAppointmentUpdateTemplate(testData);
        success = await emailService.sendAppointmentUpdate(testData, clinicId);
        break;

      case "connection":
        success = await emailService.testConnection();
        return NextResponse.json({
          success,
          message: success
            ? "Teste de conexão Resend bem-sucedido!"
            : "Falha no teste de conexão Resend",
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            error:
              "Tipo de email inválido. Use: confirmation, reminder, cancellation, update, connection",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success,
      message: success
        ? `Email de teste '${type}' enviado com sucesso via Resend!`
        : `Falha ao enviar email de teste '${type}' via Resend`,
      type,
      email,
      subject: template?.subject,
      timestamp: new Date().toISOString(),
      testData: {
        patientName: testData.patientName,
        doctorName: testData.doctorName,
        appointmentDate: testData.appointmentDate,
      },
    });
  } catch (error) {
    console.error("❌ Erro no teste de email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no teste de email",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      status: "ok",
      message: "API de teste de email Resend disponível",
      availableTypes: [
        {
          type: "confirmation",
          description: "Email de confirmação de agendamento",
        },
        {
          type: "reminder",
          description: "Lembrete 24h antes da consulta",
        },
        {
          type: "cancellation",
          description: "Notificação de cancelamento",
        },
        {
          type: "update",
          description: "Notificação de reagendamento",
        },
        {
          type: "connection",
          description: "Teste de conexão Resend",
        },
      ],
      usage: {
        method: "POST",
        body: {
          type: "string (required)",
          email: "string (required)",
        },
        example: {
          type: "confirmation",
          email: "test@example.com",
        },
      },
      resendConfigured: !!process.env.RESEND_API_KEY,
    });
  } catch (error) {
    console.error("❌ Erro na API de teste:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
