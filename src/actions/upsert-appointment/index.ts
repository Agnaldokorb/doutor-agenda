"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { logDataOperation } from "@/helpers/audit-logger";
import { convertUTCMinus3ToUTC } from "@/helpers/timezone";
import { auth } from "@/lib/auth";
import { emailService } from "@/lib/email-service";
import { actionClient } from "@/lib/next-safe-action";

import { upsertAppointmentSchema } from "./schema";

export const upsertAppointment = actionClient
  .schema(upsertAppointmentSchema)
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

    console.log("Dados recebidos do agendamento:", parsedInput);

    // Combinamos a data com o horário e convertemos UTC-3 para UTC
    const localDateTime = new Date(parsedInput.date);
    const [hours, minutes] = parsedInput.timeSlot.split(":").map(Number);

    // Definir o horário local (UTC-3)
    localDateTime.setHours(hours, minutes, 0, 0);

    // Converter para UTC usando a função utilitária
    const utcDateTime = convertUTCMinus3ToUTC(localDateTime);

    console.log("Horário local (UTC-3):", localDateTime.toISOString());
    console.log("Horário UTC para salvar:", utcDateTime.toISOString());

    // Verificar se é criação ou edição
    const isEdit = !!parsedInput.id;

    try {
      const result = await db
        .insert(appointmentsTable)
        .values({
          id: parsedInput.id,
          clinicId: session.user.clinic.id,
          patientId: parsedInput.patientId,
          doctorId: parsedInput.doctorId,
          date: utcDateTime,
          status: "agendado",
        })
        .onConflictDoUpdate({
          target: [appointmentsTable.id],
          set: {
            patientId: parsedInput.patientId,
            doctorId: parsedInput.doctorId,
            date: utcDateTime,
          },
        })
        .returning();

      const savedAppointment = result[0];

      // Log de auditoria LGPD para operação de dados
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: isEdit ? "update" : "create",
        dataType: "appointment",
        recordId: savedAppointment.id,
        changes: {
          [isEdit ? "updated" : "created"]: {
            patientId: parsedInput.patientId,
            doctorId: parsedInput.doctorId,
            date: utcDateTime.toISOString(),
            timeSlot: parsedInput.timeSlot,
            status: "agendado",
          },
        },
        success: true,
      });

      // Buscar dados completos para o email
      const appointmentData = await db.query.appointmentsTable.findFirst({
        where: (appointments, { eq }) => eq(appointments.id, result[0].id),
        with: {
          patient: true,
          doctor: true,
        },
      });

      if (!appointmentData) {
        throw new Error("Falha ao buscar dados do agendamento");
      }

      console.log("✅ Agendamento salvo:", appointmentData);

      // Enviar email de confirmação (apenas para novos agendamentos)
      if (!isEdit && appointmentData.patient.email) {
        try {
          console.log("📧 Enviando email de confirmação...");

          await emailService.sendAppointmentConfirmation({
            patientName: appointmentData.patient.name,
            doctorName: appointmentData.doctor.name,
            doctorSpecialty: appointmentData.doctor.specialty,
            appointmentDate: appointmentData.date,
            patientEmail: appointmentData.patient.email,
            price: appointmentData.doctor.appointmentPriceInCents,
            confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
          });

          console.log("✅ Email de confirmação enviado com sucesso!");
        } catch (error) {
          console.error("❌ Erro ao enviar email de confirmação:", error);
          // Não falhar o agendamento por causa do email
        }
      } else if (isEdit && appointmentData.patient && appointmentData.doctor) {
        try {
          console.log("📧 Enviando email de reagendamento...");

          await emailService.sendAppointmentUpdate({
            patientName: appointmentData.patient.name,
            doctorName: appointmentData.doctor.name,
            doctorSpecialty: appointmentData.doctor.specialty,
            appointmentDate: appointmentData.date,
            patientEmail: appointmentData.patient.email,
            price: appointmentData.doctor.appointmentPriceInCents,
            confirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments`,
          });

          console.log("✅ Email de reagendamento enviado com sucesso!");
        } catch (error) {
          console.error("❌ Erro ao enviar email de reagendamento:", error);
          // Não falhar o agendamento por causa do email
        }
      }

      revalidatePath("/appointments");
      revalidatePath("/doctor-dashboard");

      return {
        success: true,
        appointment: appointmentData,
        message: isEdit
          ? "Agendamento atualizado com sucesso!"
          : "Agendamento criado com sucesso!",
      };
    } catch (error) {
      // Log de falha na operação
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: isEdit ? "update" : "create",
        dataType: "appointment",
        recordId: parsedInput.id,
        changes: {
          error: "Falha na operação de agendamento",
          data: {
            patientId: parsedInput.patientId,
            doctorId: parsedInput.doctorId,
            timeSlot: parsedInput.timeSlot,
          },
        },
        success: false,
      });

      console.error("❌ Erro ao salvar agendamento:", error);
      throw error;
    }
  });
