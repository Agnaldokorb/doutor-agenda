import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import {
  prepareAppointmentWebhookData,
  sendAppointmentWebhook,
} from "@/helpers/n8n-webhook";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const appointmentId = params.id;

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

    // Verificar se já está cancelado
    if (appointment.status === "cancelado") {
      return NextResponse.json({
        success: true,
        message: "Agendamento já cancelado",
        appointment: {
          id: appointment.id,
          status: appointment.status,
          patient: appointment.patient.name,
          doctor: appointment.doctor.name,
        },
      });
    }

    // Atualizar o status para cancelado
    await db
      .update(appointmentsTable)
      .set({
        status: "cancelado",
        updatedAt: new Date(),
      })
      .where(eq(appointmentsTable.id, appointmentId));

    // Enviar webhook de cancelamento para n8n
    try {
      const webhookData = prepareAppointmentWebhookData(
        appointment,
        "cancelado",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      await sendAppointmentWebhook(webhookData);
    } catch (error) {
      console.error("❌ Erro ao enviar webhook n8n:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento cancelado com sucesso",
      appointment: {
        id: appointment.id,
        status: "cancelado",
        patient: appointment.patient.name,
        doctor: appointment.doctor.name,
        date: appointment.date,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao cancelar agendamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
