import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { emailService } from "@/lib/email-service";

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Definir timezone do Brasil
const TIMEZONE = "America/Sao_Paulo";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando processo de envio de lembretes...");

    // Verificar se há uma chave de API para autenticação (opcional, para segurança)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CRON_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Calcular data/hora para buscar agendamentos 24h à frente
    const now = dayjs().tz(TIMEZONE);
    const tomorrow = now.add(1, "day");

    // Criar range de 24h para capturar agendamentos
    const startOfTomorrow = tomorrow.startOf("day").utc().toDate();
    const endOfTomorrow = tomorrow.endOf("day").utc().toDate();

    console.log("📅 Buscando agendamentos para:", {
      dataLocal: tomorrow.format("DD/MM/YYYY"),
      rangeUTC: {
        inicio: startOfTomorrow.toISOString(),
        fim: endOfTomorrow.toISOString(),
      },
    });

    // Buscar agendamentos para amanhã que não estão cancelados ou concluídos
    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        sql`${appointmentsTable.date} >= ${startOfTomorrow}`,
        sql`${appointmentsTable.date} <= ${endOfTomorrow}`,
        sql`${appointmentsTable.status} IN ('agendado', 'confirmado')`,
      ),
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    console.log(
      `📋 Encontrados ${appointments.length} agendamentos para lembrete`,
    );

    if (appointments.length === 0) {
      return NextResponse.json({
        message: "Nenhum agendamento encontrado para envio de lembretes",
        sent: 0,
        failed: 0,
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const results = [];

    // Processar cada agendamento
    for (const appointment of appointments) {
      try {
        console.log(
          `📧 Processando lembrete para: ${appointment.patient.name}`,
        );

        const success = await emailService.sendAppointmentReminder({
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.name,
          doctorSpecialty: appointment.doctor.specialty,
          appointmentDate: appointment.date,
          patientEmail: appointment.patient.email,
          price: appointment.doctor.appointmentPriceInCents,
          confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
        });

        if (success) {
          emailsSent++;
          console.log(`✅ Lembrete enviado para: ${appointment.patient.email}`);
        } else {
          emailsFailed++;
          console.error(
            `❌ Falha ao enviar lembrete para: ${appointment.patient.email}`,
          );
        }

        results.push({
          appointmentId: appointment.id,
          patientEmail: appointment.patient.email,
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.name,
          appointmentDate: appointment.date,
          status: success ? "enviado" : "falhou",
        });

        // Pequeno delay entre emails
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          `❌ Erro ao processar agendamento ${appointment.id}:`,
          error,
        );
        emailsFailed++;
        results.push({
          appointmentId: appointment.id,
          patientEmail: appointment.patient.email,
          status: "erro",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    console.log(
      `📊 Processo finalizado: ${emailsSent} enviados, ${emailsFailed} falharam`,
    );

    return NextResponse.json({
      message: `Lembretes processados: ${emailsSent} enviados, ${emailsFailed} falharam`,
      sent: emailsSent,
      failed: emailsFailed,
      total: appointments.length,
      date: tomorrow.format("DD/MM/YYYY"),
      results,
    });
  } catch (error) {
    console.error("❌ Erro no processo de lembretes:", error);
    return NextResponse.json(
      {
        error: "Erro interno no envio de lembretes",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}

// Método GET para teste e status
export async function GET() {
  try {
    // Contar agendamentos para amanhã
    const now = dayjs().tz(TIMEZONE);
    const tomorrow = now.add(1, "day");
    const startOfTomorrow = tomorrow.startOf("day").utc().toDate();
    const endOfTomorrow = tomorrow.endOf("day").utc().toDate();

    const appointmentsCount = await db
      .select({ count: sql`count(*)` })
      .from(appointmentsTable)
      .where(
        and(
          sql`${appointmentsTable.date} >= ${startOfTomorrow}`,
          sql`${appointmentsTable.date} <= ${endOfTomorrow}`,
          sql`${appointmentsTable.status} IN ('agendado', 'confirmado')`,
        ),
      );

    const count = Number(appointmentsCount[0]?.count || 0);

    return NextResponse.json({
      status: "ok",
      message: "API de lembretes funcionando",
      nextReminderDate: tomorrow.format("DD/MM/YYYY"),
      appointmentsScheduled: count,
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Erro ao verificar status",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
