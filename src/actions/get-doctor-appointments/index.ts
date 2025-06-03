"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { logDataAccess } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getDoctorAppointments = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.user.clinic?.id) {
    throw new Error("Clinic not found");
  }

  console.log(`👨‍⚕️ Buscando agendamentos do médico: ${session.user.id}`);

  try {
    // Primeiro, buscar o médico associado ao usuário logado
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.userId, session.user.id),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado para este usuário");
    }

    console.log(`✅ Médico encontrado: ${doctor.name} (${doctor.id})`);

    // Log de acesso aos dados de agendamentos do médico (LGPD Art. 37)
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "appointment",
      recordId: doctor.id,
      action: "consultar agendamentos do médico",
      success: true,
    });

    // Buscar todos os agendamentos do médico
    const appointments = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, doctor.id),
      with: {
        patient: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            sex: true,
          },
        },
        doctor: {
          columns: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        healthInsurancePlan: true,
      },
      orderBy: (appointments, { desc }) => [desc(appointments.date)],
    });

    console.log(`✅ Encontrados ${appointments.length} agendamentos`);

    return {
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        email: doctor.email,
        businessHours: doctor.businessHours,
        availableFromTime: doctor.availableFromTime,
        availableToTime: doctor.availableToTime,
        availableFromWeekDay: doctor.availableFromWeekDay,
        availableToWeekDay: doctor.availableToWeekDay,
      },
      appointments,
    };
  } catch (error) {
    // Log de falha no acesso
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "appointment",
      recordId: session.user.id,
      action: "consultar agendamentos do médico",
      success: false,
    });

    console.error("❌ Erro ao buscar agendamentos do médico:", error);
    throw new Error(
      `Falha ao buscar agendamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});
