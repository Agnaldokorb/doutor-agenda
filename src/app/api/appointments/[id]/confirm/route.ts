import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import {
  prepareAppointmentWebhookData,
  sendAppointmentWebhook,
} from "@/helpers/n8n-webhook";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: appointmentId } = await params;

    // Buscar o agendamento
    const appointment = await db.query.appointmentsTable.findFirst({
      where: eq(appointmentsTable.id, appointmentId),
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se já está confirmado
    if (appointment.status === "confirmado") {
      return NextResponse.json({
        success: true,
        message: "Agendamento já confirmado",
        appointment: {
          id: appointment.id,
          status: appointment.status,
          patient: appointment.patient.name,
          doctor: appointment.doctor.name,
        },
      });
    }

    // Atualizar o status para confirmado
    await db
      .update(appointmentsTable)
      .set({
        status: "confirmado",
        updatedAt: new Date(),
      })
      .where(eq(appointmentsTable.id, appointmentId));

    // Enviar webhook de confirmação para n8n
    try {
      const webhookData = prepareAppointmentWebhookData(
        appointment,
        "confirmado",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      await sendAppointmentWebhook(webhookData);
    } catch (error) {
      console.error("❌ Erro ao enviar webhook n8n:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento confirmado com sucesso",
      appointment: {
        id: appointment.id,
        status: "confirmado",
        patient: appointment.patient.name,
        doctor: appointment.doctor.name,
        date: appointment.date,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao confirmar agendamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
