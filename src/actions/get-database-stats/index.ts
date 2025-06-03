"use server";

import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  medicalRecordsTable,
  patientsTable,
  securityLogsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getDatabaseStats = actionClient.action(async () => {
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
    `📊 Buscando estatísticas do banco da clínica: ${session.user.clinic.id}`,
  );

  try {
    // Buscar contagens de cada tabela
    const [
      doctorsCount,
      patientsCount,
      appointmentsCount,
      medicalRecordsCount,
      securityLogsCount,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(doctorsTable)
        .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
      db
        .select({ count: count() })
        .from(patientsTable)
        .where(eq(patientsTable.clinicId, session.user.clinic.id)),
      db
        .select({ count: count() })
        .from(appointmentsTable)
        .where(eq(appointmentsTable.clinicId, session.user.clinic.id)),
      db
        .select({ count: count() })
        .from(medicalRecordsTable)
        .where(eq(medicalRecordsTable.clinicId, session.user.clinic.id)),
      db
        .select({ count: count() })
        .from(securityLogsTable)
        .where(eq(securityLogsTable.clinicId, session.user.clinic.id)),
    ]);

    // Buscar último backup realizado (através dos logs de segurança)
    const lastBackupLog = session.user.clinic
      ? await db.query.securityLogsTable.findFirst({
          where: (logs, { eq, and }) =>
            and(
              eq(logs.clinicId, session.user.clinic!.id),
              eq(logs.type, "data_export"),
            ),
          orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        })
      : null;

    const stats = {
      doctors: doctorsCount[0].count,
      patients: patientsCount[0].count,
      appointments: appointmentsCount[0].count,
      medicalRecords: medicalRecordsCount[0].count,
      securityLogs: securityLogsCount[0].count,
      totalRecords:
        doctorsCount[0].count +
        patientsCount[0].count +
        appointmentsCount[0].count +
        medicalRecordsCount[0].count,
      lastBackup: lastBackupLog?.createdAt || null,
      estimatedSize: calculateEstimatedSize(
        doctorsCount[0].count,
        patientsCount[0].count,
        appointmentsCount[0].count,
        medicalRecordsCount[0].count,
        securityLogsCount[0].count,
      ),
    };

    console.log("✅ Estatísticas do banco coletadas:", stats);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas do banco:", error);
    throw new Error(
      `Falha ao buscar estatísticas do banco: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});

// Função para calcular tamanho estimado baseado nos registros
function calculateEstimatedSize(
  doctors: number,
  patients: number,
  appointments: number,
  medicalRecords: number,
  securityLogs: number,
): string {
  // Estimativa baseada em tamanhos médios por registro (em KB)
  const avgSizes = {
    doctor: 2, // 2KB por médico
    patient: 1.5, // 1.5KB por paciente
    appointment: 1, // 1KB por agendamento
    medicalRecord: 5, // 5KB por prontuário (texto)
    securityLog: 0.5, // 0.5KB por log
  };

  const totalKB =
    doctors * avgSizes.doctor +
    patients * avgSizes.patient +
    appointments * avgSizes.appointment +
    medicalRecords * avgSizes.medicalRecord +
    securityLogs * avgSizes.securityLog;

  if (totalKB < 1024) {
    return `${totalKB.toFixed(1)} KB`;
  } else if (totalKB < 1024 * 1024) {
    return `${(totalKB / 1024).toFixed(1)} MB`;
  } else {
    return `${(totalKB / (1024 * 1024)).toFixed(1)} GB`;
  }
}
