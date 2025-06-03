"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { healthInsurancePlansTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getHealthInsurancePlans = actionClient.action(async () => {
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
    console.log(
      `💳 Buscando planos de saúde da clínica: ${session.user.clinic.id}`,
    );

    const healthInsurancePlans =
      await db.query.healthInsurancePlansTable.findMany({
        where: eq(healthInsurancePlansTable.clinicId, session.user.clinic.id),
        orderBy: (table, { asc }) => [asc(table.name)],
      });

    console.log(
      `✅ Encontrados ${healthInsurancePlans.length} planos de saúde`,
    );

    return healthInsurancePlans;
  } catch (error) {
    console.error("❌ Erro ao buscar planos de saúde:", error);

    if (error instanceof Error) {
      throw new Error(`Falha ao buscar planos de saúde: ${error.message}`);
    }

    throw new Error("Falha ao buscar planos de saúde: Erro desconhecido");
  }
});
