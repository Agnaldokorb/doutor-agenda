"use server";

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const getPatientAppointmentsSchema = z.object({
  patientId: z.string().uuid("ID do paciente deve ser um UUID válido"),
});

export const getPatientAppointments = actionClient
  .schema(getPatientAppointmentsSchema)
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

    console.log(
      `📅 Buscando agendamentos do paciente: ${parsedInput.patientId}`,
    );

    try {
      // Buscar agendamentos não concluídos do paciente
      const appointments = await db.query.appointmentsTable.findMany({
        where: and(
          eq(appointmentsTable.patientId, parsedInput.patientId),
          eq(appointmentsTable.clinicId, session.user.clinic.id),
        ),
        with: {
          doctor: {
            columns: {
              id: true,
              name: true,
              specialty: true,
            },
          },
        },
        orderBy: (appointments, { desc }) => [desc(appointments.date)],
      });

      console.log(`✅ Encontrados ${appointments.length} agendamentos`);

      return {
        success: true,
        appointments,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      throw new Error(
        `Falha ao buscar agendamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
