"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
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

    // Se for edição, buscar imagem antiga para exclusão
    if (parsedInput.id) {
      console.log(`📝 Editando paciente existente: ${parsedInput.name}`);

      const existingPatient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, parsedInput.id),
      });

      if (existingPatient) {
        oldAvatarUrl = existingPatient.avatarImageUrl;
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

    await db
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
      });

    console.log(`✅ Paciente salvo com sucesso: ${parsedInput.name}`);
    revalidatePath("/patients");
  });
