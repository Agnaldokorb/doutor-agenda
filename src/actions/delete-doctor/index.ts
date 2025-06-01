"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { doctorsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deleteDoctor = actionClient
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

    // Busca o médico com informações do usuário associado
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.id),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado");
    }

    if (doctor.clinicId !== session.user.clinic?.id) {
      throw new Error("Médico não encontrado");
    }

    console.log(`Deletando médico: ${doctor.name} (${doctor.email})`);

    // Se o médico tem usuário associado, deleta o usuário primeiro
    if (doctor.userId) {
      try {
        console.log(`Deletando usuário associado: ${doctor.userId}`);

        // Remove a associação usuário-clínica
        await db
          .delete(usersToClinicsTable)
          .where(eq(usersToClinicsTable.userId, doctor.userId));
        console.log("Associação usuário-clínica removida");

        // Deleta o usuário da tabela users
        await db.delete(usersTable).where(eq(usersTable.id, doctor.userId));
        console.log("Usuário removido da tabela users");

        // Nota: O BetterAuth usa cascading delete, então quando deletamos da tabela users,
        // as outras tabelas relacionadas (sessions, accounts, etc.) são automaticamente limpas

        console.log(`Usuário ${doctor.userId} deletado com sucesso`);
      } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        // Continua com a exclusão do médico mesmo se falhar ao deletar o usuário
        console.log(
          "Continuando com a exclusão do médico apesar do erro no usuário",
        );
      }
    } else {
      // Se não tem user_id, tenta buscar usuário pelo email do médico
      try {
        console.log(`Buscando usuário pelo email: ${doctor.email}`);

        const userByEmail = await db.query.usersTable.findFirst({
          where: eq(usersTable.email, doctor.email),
        });

        if (userByEmail) {
          console.log(`Usuário encontrado pelo email: ${userByEmail.id}`);

          // Remove a associação usuário-clínica
          await db
            .delete(usersToClinicsTable)
            .where(eq(usersToClinicsTable.userId, userByEmail.id));
          console.log("Associação usuário-clínica removida");

          // Deleta o usuário da tabela users
          await db.delete(usersTable).where(eq(usersTable.id, userByEmail.id));
          console.log("Usuário removido da tabela users");

          console.log(`Usuário ${userByEmail.id} deletado com sucesso`);
        } else {
          console.log(
            "Médico não tem usuário associado nem usuário com mesmo email, deletando apenas o médico",
          );
        }
      } catch (error) {
        console.error("Erro ao buscar/deletar usuário pelo email:", error);
        console.log(
          "Continuando com a exclusão do médico apesar do erro no usuário",
        );
      }
    }

    // Deleta o médico
    await db.delete(doctorsTable).where(eq(doctorsTable.id, parsedInput.id));
    console.log(`Médico ${doctor.name} deletado com sucesso`);

    revalidatePath("/doctors");
  });
