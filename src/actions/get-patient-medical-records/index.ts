"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { medicalRecordsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const getPatientMedicalRecordsSchema = z.object({
  patientId: z.string().uuid("ID do paciente deve ser um UUID válido"),
});

export const getPatientMedicalRecords = actionClient
  .schema(getPatientMedicalRecordsSchema)
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
      `📋 Buscando prontuários do paciente: ${parsedInput.patientId}`,
    );

    try {
      // Buscar todos os prontuários do paciente na clínica
      const medicalRecords = await db.query.medicalRecordsTable.findMany({
        where: eq(medicalRecordsTable.patientId, parsedInput.patientId),
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
          appointment: {
            columns: {
              id: true,
              date: true,
              status: true,
            },
          },
        },
        orderBy: (medicalRecords, { desc }) => [desc(medicalRecords.createdAt)],
      });

      console.log(`✅ Encontrados ${medicalRecords.length} prontuários`);

      // Filtrar apenas os prontuários da clínica atual (segurança extra)
      const filteredRecords = medicalRecords.filter(
        (record) => record.clinicId === session.user.clinic?.id,
      );

      return {
        success: true,
        medicalRecords: filteredRecords,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar prontuários:", error);
      throw new Error(
        `Falha ao buscar prontuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
