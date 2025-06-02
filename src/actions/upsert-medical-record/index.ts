"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable,medicalRecordsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertMedicalRecordSchema } from "./schema";

export const upsertMedicalRecord = actionClient
  .schema(upsertMedicalRecordSchema)
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

    console.log("📋 Dados do prontuário recebidos:", parsedInput);

    try {
      await db
        .insert(medicalRecordsTable)
        .values({
          ...parsedInput,
          id: parsedInput.id,
          clinicId: session.user.clinic.id,
          // Se certificateDays não for fornecido e medicalCertificate for true, definir como null
          certificateDays: parsedInput.medicalCertificate
            ? parsedInput.certificateDays
            : null,
        })
        .onConflictDoUpdate({
          target: [medicalRecordsTable.id],
          set: {
            ...parsedInput,
            clinicId: session.user.clinic.id,
            certificateDays: parsedInput.medicalCertificate
              ? parsedInput.certificateDays
              : null,
            updatedAt: new Date(),
          },
        });

      console.log("✅ Prontuário salvo com sucesso");

      // Se houver um appointmentId, marcar o agendamento como concluído
      if (parsedInput.appointmentId) {
        console.log(
          `🏥 Marcando agendamento ${parsedInput.appointmentId} como concluído`,
        );

        await db
          .update(appointmentsTable)
          .set({
            status: "concluido",
            updatedAt: new Date(),
          })
          .where(eq(appointmentsTable.id, parsedInput.appointmentId));

        console.log("✅ Agendamento marcado como concluído");
      }

      // Revalidar as páginas relevantes
      revalidatePath(`/patient/${parsedInput.patientId}`);
      revalidatePath("/appointments");
      revalidatePath("/doctor-dashboard");

      return {
        success: true,
        message: parsedInput.id
          ? "Prontuário atualizado com sucesso!"
          : "Prontuário criado com sucesso!",
      };
    } catch (error) {
      console.error("❌ Erro ao salvar prontuário:", error);
      throw new Error(
        `Falha ao salvar prontuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
 