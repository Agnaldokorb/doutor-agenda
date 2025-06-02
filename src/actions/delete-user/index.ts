"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  usersTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const deleteUserSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
});

export const deleteUser = actionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autorizado");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem excluir usuários");
    }

    const clinicId = session.user.clinic?.id;
    if (!clinicId) {
      throw new Error("Usuário não está associado a uma clínica");
    }

    // Não permitir que o usuário delete a si mesmo
    if (parsedInput.userId === session.user.id) {
      throw new Error("Você não pode excluir sua própria conta");
    }

    try {
      console.log(`🗑️ Iniciando exclusão do usuário: ${parsedInput.userId}`);

      // 1. Buscar informações do usuário
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, parsedInput.userId),
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      console.log(
        `👤 Usuário encontrado: ${user.name} (${user.email}) - Tipo: ${user.userType}`,
      );

      // 2. Verificar se o usuário pertence à mesma clínica
      const userClinicAssociation =
        await db.query.usersToClinicsTable.findFirst({
          where: eq(usersToClinicsTable.userId, parsedInput.userId),
        });

      if (
        !userClinicAssociation ||
        userClinicAssociation.clinicId !== clinicId
      ) {
        throw new Error("Usuário não pertence a esta clínica");
      }

      // 3. Se for médico, remover consultas associadas primeiro
      if (user.userType === "doctor") {
        console.log("👨‍⚕️ Usuário é médico, buscando dados do médico...");

        const doctor = await db.query.doctorsTable.findFirst({
          where: eq(doctorsTable.userId, parsedInput.userId),
        });

        if (doctor) {
          console.log(
            `🏥 Médico encontrado: ${doctor.name} - Removendo consultas...`,
          );

          // Deletar todas as consultas do médico
          const deletedAppointments = await db
            .delete(appointmentsTable)
            .where(eq(appointmentsTable.doctorId, doctor.id))
            .returning();

          console.log(`📅 ${deletedAppointments.length} consultas removidas`);

          // Deletar o registro do médico
          await db.delete(doctorsTable).where(eq(doctorsTable.id, doctor.id));

          console.log("👨‍⚕️ Registro de médico removido");
        }
      }

      // 4. Remover associação usuário-clínica
      await db
        .delete(usersToClinicsTable)
        .where(eq(usersToClinicsTable.userId, parsedInput.userId));

      console.log("🔗 Associação usuário-clínica removida");

      // 5. Deletar o usuário (isso também remove sessões, contas, etc. via cascade)
      await db.delete(usersTable).where(eq(usersTable.id, parsedInput.userId));

      console.log(`✅ Usuário ${user.name} deletado com sucesso`);

      revalidatePath("/configurations");
      revalidatePath("/doctors");
      revalidatePath("/appointments");

      return {
        success: true,
        message: `Usuário ${user.name} foi excluído com sucesso`,
        deletedAppointments: user.userType === "doctor",
      };
    } catch (error) {
      console.error("❌ Erro ao deletar usuário:", error);
      throw new Error(
        error instanceof Error
          ? `Erro ao excluir usuário: ${error.message}`
          : "Erro desconhecido ao excluir usuário",
      );
    }
  });
