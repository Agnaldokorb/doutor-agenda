"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getCurrentDoctor = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.user.clinic?.id) {
    throw new Error("Clinic not found");
  }

  console.log(`👨‍⚕️ Buscando médico da sessão: ${session.user.id}`);

  try {
    // Buscar o médico associado ao usuário logado
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.userId, session.user.id),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado para este usuário");
    }

    console.log(`✅ Médico encontrado: ${doctor.name} (${doctor.id})`);

    return {
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        email: doctor.email,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao buscar médico:", error);
    throw new Error(
      `Falha ao buscar médico: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
}); 