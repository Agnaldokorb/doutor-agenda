"use server";

import { and, count, eq, gte, isNull, lte, ne, or, sum } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentPaymentsTable, appointmentsTable } from "@/db/schema";
import { logDataAccess } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getBillingStats = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.user.clinic?.id) {
    throw new Error("Clinic not found");
  }

  // Verificar se o usuário tem permissão (admin ou atendente)
  if (!["admin", "atendente"].includes(session.user.userType)) {
    throw new Error("Usuário não tem permissão para acessar dados de billing");
  }

  console.log(
    `📊 Buscando estatísticas de billing para clínica ${session.user.clinic.id}`,
  );

  try {
    // Log de acesso aos dados (LGPD Art. 37)
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "billing_stats",
      recordId: "billing_statistics",
      action: "consultar estatísticas de billing",
      success: true,
    });

    // Definir intervalo do dia atual (00:00 até 23:59)
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    // 1. Consultas pendentes de pagamento
    // Busca consultas particulares que não estão canceladas E que:
    // - Não têm nenhum registro de pagamento OU
    // - Têm pagamento mas não estão com status "pago"
    const pendingAppointments = await db
      .select({
        count: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .leftJoin(
        appointmentPaymentsTable,
        eq(appointmentsTable.id, appointmentPaymentsTable.appointmentId),
      )
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          ne(appointmentsTable.status, "cancelado"), // Excluir cancelados
          isNull(appointmentsTable.healthInsurancePlanId), // Apenas particulares (sem plano de saúde)
          // Condição: sem pagamento OU pagamento não finalizado
          or(
            isNull(appointmentPaymentsTable.id), // Caso 1: Nenhum registro de pagamento
            ne(appointmentPaymentsTable.status, "pago"), // Caso 2: Pagamento existe mas não está "pago"
          ),
        ),
      );

    // 2. Pagamentos realizados hoje
    const paymentsToday = await db
      .select({
        count: count(appointmentPaymentsTable.id),
      })
      .from(appointmentPaymentsTable)
      .where(
        and(
          eq(appointmentPaymentsTable.clinicId, session.user.clinic.id),
          eq(appointmentPaymentsTable.status, "pago"),
          gte(appointmentPaymentsTable.createdAt, startOfDay),
          lte(appointmentPaymentsTable.createdAt, endOfDay),
        ),
      );

    // 3. Faturamento total do dia
    const dailyRevenue = await db
      .select({
        totalRevenue: sum(appointmentPaymentsTable.paidAmountInCents),
      })
      .from(appointmentPaymentsTable)
      .where(
        and(
          eq(appointmentPaymentsTable.clinicId, session.user.clinic.id),
          eq(appointmentPaymentsTable.status, "pago"),
          gte(appointmentPaymentsTable.createdAt, startOfDay),
          lte(appointmentPaymentsTable.createdAt, endOfDay),
        ),
      );

    const stats = {
      pendingAppointments: Number(pendingAppointments[0]?.count || 0),
      paymentsToday: Number(paymentsToday[0]?.count || 0),
      dailyRevenueInCents: Number(dailyRevenue[0]?.totalRevenue || 0),
    };

    console.log("✅ Estatísticas de billing calculadas:", stats);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    // Log de falha no acesso
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "billing_stats",
      recordId: "billing_statistics",
      action: "consultar estatísticas de billing",
      success: false,
    });

    console.error("❌ Erro ao buscar estatísticas de billing:", error);
    throw new Error(
      `Falha ao buscar estatísticas de billing: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});
