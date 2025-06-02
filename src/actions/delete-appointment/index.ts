"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { logDataOperation } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { actionClient } from "@/lib/next-safe-action";

const deleteAppointmentSchema = z.object({
  id: z.string().uuid(),
});

export const deleteAppointment = actionClient
  .schema(deleteAppointmentSchema)
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

    console.log("Cancelando agendamento:", parsedInput.id);

    try {
      // Buscar dados do agendamento antes de deletar (para o email e log)
      const appointmentData = await db.query.appointmentsTable.findFirst({
        where: (appointments, { eq, and }) =>
          and(
            eq(appointments.id, parsedInput.id),
            eq(appointments.clinicId, session.user.clinic!.id),
          ),
        with: {
          patient: true,
          doctor: true,
        },
      });

      if (!appointmentData) {
        throw new Error("Agendamento não encontrado");
      }

      // Deletar o agendamento
      await db
        .delete(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.id, parsedInput.id),
            eq(appointmentsTable.clinicId, session.user.clinic.id),
          ),
        );

      // Log de auditoria LGPD para exclusão
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: "delete",
        dataType: "appointment",
        recordId: parsedInput.id,
        changes: {
          deleted: {
            patientName: appointmentData.patient.name,
            doctorName: appointmentData.doctor.name,
            date: appointmentData.date,
            status: appointmentData.status,
          },
        },
        success: true,
      });

      // Enviar email de cancelamento para o paciente
      if (appointmentData.patient.email) {
        console.log(
          "📧 Enviando email de cancelamento para:",
          appointmentData.patient.email,
        );

        try {
          await emailService.sendCancellationEmail({
            to: appointmentData.patient.email,
            patientName: appointmentData.patient.name,
            doctorName: appointmentData.doctor.name,
            appointmentDate: appointmentData.date,
          });
          console.log("✅ Email de cancelamento enviado");
        } catch (emailError) {
          console.error("❌ Erro ao enviar email de cancelamento:", emailError);
          // Não falha a operação por causa do email
        }
      }

      console.log("✅ Agendamento cancelado com sucesso");
      revalidatePath("/appointments");
    } catch (error) {
      // Log de falha na operação
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: "delete",
        dataType: "appointment",
        recordId: parsedInput.id,
        changes: { error: "Falha na exclusão do agendamento" },
        success: false,
      });

      console.error("❌ Erro ao cancelar agendamento:", error);
      throw error;
    }
  });
