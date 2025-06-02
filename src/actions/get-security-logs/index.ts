"use server";

import { and, desc, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { securityLogsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getSecurityLogsSchema } from "./schema";

export const getSecurityLogs = actionClient
  .schema(getSecurityLogsSchema)
  .action(async ({ parsedInput: { limit = 50, days = 30 } }) => {
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
      `🔍 Buscando logs de segurança da clínica: ${session.user.clinic.id}`,
    );

    try {
      // Calcular data de início baseada nos dias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar logs de segurança da clínica
      const logs = await db.query.securityLogsTable.findMany({
        where: and(
          eq(securityLogsTable.clinicId, session.user.clinic.id),
          gte(securityLogsTable.createdAt, startDate),
        ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              userType: true,
            },
          },
        },
        orderBy: [desc(securityLogsTable.createdAt)],
        limit,
      });

      console.log(`✅ Encontrados ${logs.length} logs de segurança`);

      return {
        success: true,
        logs,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar logs de segurança:", error);
      throw new Error(
        `Falha ao buscar logs de segurança: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
