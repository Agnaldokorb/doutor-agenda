"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { logDataAccess, logDataOperation } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { deleteFileByUrl } from "@/lib/utapi";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
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

    console.log("Dados recebidos:", parsedInput);

    if (!parsedInput.phone_number) {
      throw new Error("Número de telefone é obrigatório");
    }

    let oldAvatarUrl: string | null = null;
    let isUpdate = false;
    let existingPatientData: typeof patientsTable.$inferSelect | null = null;

    // Se for edição, buscar imagem antiga para exclusão
    if (parsedInput.id) {
      console.log(`📝 Editando paciente existente: ${parsedInput.name}`);
      isUpdate = true;

      const existingPatient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, parsedInput.id),
      });

      if (existingPatient) {
        oldAvatarUrl = existingPatient.avatarImageUrl;
        existingPatientData = existingPatient;

        // Log de acesso aos dados do paciente (LGPD Art. 37)
        await logDataAccess({
          userId: session.user.id,
          clinicId: session.user.clinic.id,
          dataType: "patient",
          recordId: parsedInput.id,
          action: "acessar para edição",
        });
      }
    } else {
      console.log(`🏥 Criando novo paciente: ${parsedInput.name}`);
    }

    // Verificar se deve excluir imagem antiga
    if (
      oldAvatarUrl &&
      parsedInput.avatarImageUrl &&
      oldAvatarUrl !== parsedInput.avatarImageUrl
    ) {
      console.log(`🗑️ Excluindo imagem antiga do paciente: ${oldAvatarUrl}`);
      try {
        const deleted = await deleteFileByUrl(oldAvatarUrl);
        if (deleted) {
          console.log(`✅ Imagem antiga do paciente excluída com sucesso`);
        } else {
          console.log(
            `⚠️ Não foi possível excluir a imagem antiga do paciente`,
          );
        }
      } catch (error) {
        console.error("❌ Erro ao excluir imagem antiga do paciente:", error);
        // Não falha a operação por causa disso
      }
    }

    try {
      const result = await db
        .insert(patientsTable)
        .values({
          ...parsedInput,
          id: parsedInput.id,
          clinicId: session?.user.clinic?.id,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          set: {
            ...parsedInput,
          },
        })
        .returning();

      const savedPatient = result[0];

      // Log de auditoria LGPD para operação de dados
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: isUpdate ? "update" : "create",
        dataType: "patient",
        recordId: savedPatient.id,
        changes: isUpdate
          ? {
              before: existingPatientData
                ? {
                    name: existingPatientData.name,
                    email: existingPatientData.email,
                    phone_number: existingPatientData.phone_number,
                    sex: existingPatientData.sex,
                  }
                : null,
              after: {
                name: parsedInput.name,
                email: parsedInput.email,
                phone_number: parsedInput.phone_number,
                sex: parsedInput.sex,
              },
            }
          : {
              created: {
                name: parsedInput.name,
                email: parsedInput.email,
                phone_number: parsedInput.phone_number,
                sex: parsedInput.sex,
              },
            },
        success: true,
      });

      console.log(`✅ Paciente salvo com sucesso: ${parsedInput.name}`);
      revalidatePath("/patients");
    } catch (error) {
      // Log de falha na operação
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: isUpdate ? "update" : "create",
        dataType: "patient",
        recordId: parsedInput.id,
        changes: { error: "Falha na operação de salvar paciente" },
        success: false,
      });

      console.error("❌ Erro ao salvar paciente:", error);
      throw error;
    }
  });
