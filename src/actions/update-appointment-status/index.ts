"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import {
  prepareAppointmentWebhookData,
  sendAppointmentWebhook,
} from "@/helpers/n8n-webhook";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { appointmentStatus } from "./types";

const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(appointmentStatus),
});

export const updateAppointmentStatus = actionClient
  .schema(updateAppointmentStatusSchema)
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

    // Buscar dados completos do agendamento antes da atualização
    const appointmentData = await db.query.appointmentsTable.findFirst({
      where: (appointments, { eq, and }) =>
        and(
          eq(appointments.id, parsedInput.id),
          eq(appointments.clinicId, session.user.clinic.id),
        ),
      with: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    if (!appointmentData) {
      throw new Error("Agendamento não encontrado");
    }

    // Atualiza o status do agendamento
    await db
      .update(appointmentsTable)
      .set({
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(
        sql`${appointmentsTable.id} = ${parsedInput.id} AND ${appointmentsTable.clinicId} = ${session.user.clinic.id}`,
      );

    // Enviar webhook para n8n se o status for relevante
    if (["confirmado", "cancelado"].includes(parsedInput.status)) {
      try {
        const webhookData = prepareAppointmentWebhookData(
          appointmentData,
          parsedInput.status as "confirmado" | "cancelado",
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        );
        await sendAppointmentWebhook(webhookData);
      } catch (error) {
        console.error("❌ Erro ao enviar webhook n8n:", error);
        // Não falhar a atualização por causa do webhook
      }
    }

    revalidatePath("/appointments");
  });
