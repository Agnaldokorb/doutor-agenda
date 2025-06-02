"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable,usersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getClinicUsers = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  const clinicId = session.user.clinic?.id;
  if (!clinicId) {
    throw new Error("Usuário não está associado a uma clínica");
  }

  try {
    console.log("🔍 Buscando usuários da clínica...");

    // Buscar todos os usuários associados à clínica
    const clinicUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        image: usersTable.image,
        userType: usersTable.userType,
        emailVerified: usersTable.emailVerified,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        // Dados do médico (se for médico)
        doctorId: doctorsTable.id,
        specialty: doctorsTable.specialty,
      })
      .from(usersTable)
      .innerJoin(
        usersToClinicsTable,
        eq(usersTable.id, usersToClinicsTable.userId),
      )
      .leftJoin(doctorsTable, eq(usersTable.id, doctorsTable.userId))
      .where(eq(usersToClinicsTable.clinicId, clinicId));

    console.log(`✅ Encontrados ${clinicUsers.length} usuários na clínica`);

    return {
      users: clinicUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Dados específicos do médico
        doctorInfo: user.doctorId
          ? {
              id: user.doctorId,
              specialty: user.specialty,
            }
          : null,
      })),
    };
  } catch (error) {
    console.error("❌ Erro ao buscar usuários da clínica:", error);
    throw new Error(
      error instanceof Error
        ? `Erro ao buscar usuários: ${error.message}`
        : "Erro desconhecido ao buscar usuários da clínica",
    );
  }
});
