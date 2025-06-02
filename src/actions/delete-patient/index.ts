"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { logDataOperation } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deletePatient = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
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

    try {
      const patient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, parsedInput.id),
      });

      if (!patient) {
        throw new Error("Paciente não encontrado");
      }

      if (patient.clinicId !== session.user.clinic?.id) {
        throw new Error("Paciente não encontrado");
      }

      await db
        .delete(patientsTable)
        .where(eq(patientsTable.id, parsedInput.id));

      // Log de auditoria LGPD para exclusão
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: "delete",
        dataType: "patient",
        recordId: parsedInput.id,
        changes: {
          deleted: {
            name: patient.name,
            email: patient.email,
            phone_number: patient.phone_number,
            sex: patient.sex,
          },
        },
        success: true,
      });

      revalidatePath("/patients");
    } catch (error) {
      // Log de falha na operação
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: "delete",
        dataType: "patient",
        recordId: parsedInput.id,
        changes: { error: "Falha na exclusão do paciente" },
        success: false,
      });

      console.error("❌ Erro ao deletar paciente:", error);
      throw error;
    }
  });
