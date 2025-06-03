"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { logDataAccess } from "@/helpers/audit-logger";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getPendingPrivateAppointments = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.user.clinic?.id) {
    throw new Error("Clinic not found");
  }

  console.log(`💰 Buscando agendamentos particulares pendentes de pagamento`);

  try {
    // Log de acesso aos dados (LGPD Art. 37)
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "appointment",
      recordId: "pending_private_appointments",
      action: "consultar agendamentos particulares pendentes",
      success: true,
    });

    // Buscar agendamentos particulares (sem plano de saúde) que não estão cancelados
    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        ne(appointmentsTable.status, "cancelado"), // Incluir todos exceto cancelados
        isNull(appointmentsTable.healthInsurancePlanId), // Só particulares
      ),
      with: {
        patient: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
          },
        },
        doctor: {
          columns: {
            id: true,
            name: true,
            specialty: true,
            appointmentPriceInCents: true,
          },
        },
        payment: {
          with: {
            transactions: true,
          },
        },
      },
      orderBy: (appointments, { desc }) => [desc(appointments.date)],
    });

    // Filtrar apenas agendamentos que não têm pagamento ou têm pagamento pendente/parcial
    const pendingAppointments = appointments.filter((appointment) => {
      if (!appointment.payment) {
        // Sem registro de pagamento = pendente
        return true;
      }

      // Com registro de pagamento, verificar se está pendente ou parcial
      return (
        appointment.payment.status === "pendente" ||
        appointment.payment.status === "parcial"
      );
    });

    console.log(
      `✅ Encontrados ${pendingAppointments.length} agendamentos pendentes de pagamento`,
    );

    return {
      success: true,
      appointments: pendingAppointments,
    };
  } catch (error) {
    // Log de falha no acesso
    await logDataAccess({
      userId: session.user.id,
      clinicId: session.user.clinic.id,
      dataType: "appointment",
      recordId: "pending_private_appointments",
      action: "consultar agendamentos particulares pendentes",
      success: false,
    });

    console.error("❌ Erro ao buscar agendamentos pendentes:", error);
    throw new Error(
      `Falha ao buscar agendamentos pendentes: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});
