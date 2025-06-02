"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
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

    // Buscar dados do agendamento antes de deletar (para o email)
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

    // Enviar email de cancelamento
    if (appointmentData.patient && appointmentData.doctor) {
      try {
        console.log("📧 Enviando email de cancelamento...");

        await emailService.sendAppointmentCancellation({
          patientName: appointmentData.patient.name,
          doctorName: appointmentData.doctor.name,
          doctorSpecialty: appointmentData.doctor.specialty,
          appointmentDate: appointmentData.date,
          patientEmail: appointmentData.patient.email,
          price: appointmentData.doctor.appointmentPriceInCents,
          confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
        });

        console.log("✅ Email de cancelamento enviado com sucesso!");
      } catch (error) {
        console.error("❌ Erro ao enviar email de cancelamento:", error);
        // Não falhar o cancelamento por causa do email
      }
    }

    revalidatePath("/appointments");

    return {
      message: "Agendamento cancelado com sucesso!",
      emailSent: !!appointmentData.patient && !!appointmentData.doctor,
    };
  });
